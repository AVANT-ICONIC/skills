"""Local core for the Social Watch MCP bridge.

Runs the existing, tested acquisition and video-watch utilities. No paid model
and no arbitrary URL fetcher. Workspaces and tokens never leave the host.
"""
from __future__ import annotations

import json
import os
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
SOCIAL = HERE.parent
REPO = SOCIAL.parent
sys.path.insert(0, str(SOCIAL / "scripts"))
from social_ingest import identify, ingest  # noqa: E402

MAX_JOBS = 15
MAX_BYTES = 250 * 1024 * 1024
TTL_SECONDS = 20 * 60


def _run(argv: list[str], timeout: int) -> subprocess.CompletedProcess[str]:
    return subprocess.run(argv, capture_output=True, text=True, check=False,
                          timeout=timeout, encoding="utf-8", errors="replace")


class SocialWatchBridge:
    """Process-local, bounded, short-lived cache; one worker per deployment."""

    def __init__(self, root: Path | None = None, ttl: int = TTL_SECONDS) -> None:
        self.root = root or Path(tempfile.mkdtemp(prefix="social-watch-mcp-"))
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.ttl = ttl
        self.jobs: dict[str, dict[str, Any]] = {}
        self.lock = threading.RLock()

    def _clean(self) -> None:
        now = time.time()
        for key, job in list(self.jobs.items()):
            if now - job["created"] > self.ttl:
                del self.jobs[key]
                shutil.rmtree(self.root / key, ignore_errors=True)
        if len(self.jobs) >= MAX_JOBS:
            old = min(self.jobs, key=lambda k: self.jobs[k]["created"])
            del self.jobs[old]
            shutil.rmtree(self.root / old, ignore_errors=True)

    def _job(self, job_id: str) -> dict[str, Any]:
        with self.lock:
            self._clean()
            job = self.jobs.get(job_id)
            if not job:
                raise KeyError("Session expired or invalid")
            return job

    def _validate_media(self, media: str, directory: Path) -> Path:
        path = Path(media).resolve()
        if not path.is_relative_to(directory.resolve()) or not path.is_file():
            raise ValueError("Acquired media is outside job scratch directory")
        if not 0 < path.stat().st_size <= MAX_BYTES:
            raise ValueError("Media exceeds safe file size limit")
        return path

    def resolve(self, url: str, *, max_frames: int = 48) -> dict[str, Any]:
        platform, cleaned = identify(url)
        if not 6 <= max_frames <= 60:
            raise ValueError("max_frames must be 6–60")
        with self.lock:
            self._clean()
            ident = secrets.token_urlsafe(18)
            folder = self.root / ident
            folder.mkdir(mode=0o700)
            self.jobs[ident] = {"created": time.time(), "url": cleaned,
                                "platform": platform, "media": [], "sheets": [],
                                "manifest": {}, "transcript": "", "state": "unavailable"}
        try:
            manifest = ingest(cleaned, folder / "source", acquire_media=True, timeout=90)
            job = self._job(ident)
            job["manifest"] = manifest
            job["state"] = manifest.get("status", "unavailable")
            subtitle = manifest.get("caption_transcript_file")
            if subtitle:
                txt = self._validate_media_path(subtitle, folder)
                job["transcript"] = txt.read_text(encoding="utf-8", errors="replace")[:50000]
            media = [self._validate_media(path, folder)
                     for path in manifest.get("media_files", [])[:3]
                     if Path(path).suffix.lower() in (".mp4", ".webm", ".mov", ".mkv", ".m4v", ".avi", ".flv", ".wmv")]
            # Strictly no video-watch pass on failed/partial download.
            if manifest["status"] == "media_acquired_uninspected" and media:
                helper = REPO / "video-watch" / "scripts" / "video_watch.py"
                if helper.is_file() and shutil.which("ffmpeg") and shutil.which("ffprobe"):
                    out = folder / "visual"
                    proc = _run([sys.executable, str(helper), str(media[0]), "--max-frames",
                                 str(max_frames), "--out-dir", str(out)], timeout=115)
                    if proc.returncode == 0:
                        sheets = sorted(out.rglob("*.jpg"))
                        job["sheets"] = [str(p) for p in sheets
                                         if "sheet" in p.name and p.is_file()
                                         and p.stat().st_size <= 3_000_000]
                        if not job["sheets"]:
                            # Some versions nest sheets under contact_sheets; don't bluff.
                            job["state"] = "media_acquired_uninspected"
                        else:
                            job["state"] = "frames_prepared_uninspected"
                        report = out / "manifest.md"
                        if report.exists():
                            job["frame_manifest"] = report.read_text(encoding="utf-8",errors="replace")[:50000]
                    else:
                        job["warnings"] = ["video-watch extraction failed: " + proc.stderr[-220:]]
            return self.summary(ident)
        except Exception:
            self.delete(ident)
            raise

    def _validate_media_path(self, path: str, directory: Path) -> Path:
        value = Path(path).resolve()
        if not value.is_relative_to(directory.resolve()) or not value.is_file():
            raise ValueError("Non-local evidence path")
        return value

    def summary(self, job_id: str) -> dict[str, Any]:
        job = self._job(job_id)
        manifest = job["manifest"]
        return {"job_id": job_id, "platform": job["platform"],
                "source_url": job["url"], "state": job["state"],
                "metadata": manifest.get("metadata", {}),
                "attempts": manifest.get("attempts", []),
                "warnings": manifest.get("warnings", []) + job.get("warnings", []),
                "caption_available": bool(job["transcript"]),
                "contact_sheets": len(job["sheets"]),
                "visuals_inspected": False,
                "note": "Prepared frames are not watched until model actually inspects returned image blocks"}

    def sheet(self, job_id: str, index: int = 0) -> bytes:
        job = self._job(job_id)
        if index < 0 or index >= len(job["sheets"]):
            raise IndexError("Requested contact sheet is not available")
        path = self._validate_media_path(job["sheets"][index], self.root / job_id)
        if path.stat().st_size > 3_000_000:
            raise ValueError("Sheet too large")
        return path.read_bytes()

    def captions(self, job_id: str) -> str:
        return self._job(job_id)["transcript"] or "No verified source caption track."

    def speech(self, job_id: str) -> str:
        job = self._job(job_id)
        if job.get("speech"):
            return job["speech"]
        candidates = [p for p in job["manifest"].get("media_files", [])
                      if Path(p).suffix.lower() in (".mp4", ".webm", ".mkv", ".mov")]
        if not candidates or job["state"] in ("unavailable", "partial_media_unverified"):
            return "No safely acquired playable source audio."
        if not os.environ.get("SOCIAL_WATCH_ENABLE_STT"):
            return "Server STT disabled; set SOCIAL_WATCH_ENABLE_STT=1 after installing faster-whisper."
        source = self._validate_media(candidates[0], self.root / job_id)
        runner = SOCIAL / "scripts" / "audio_transcribe.py"
        result = _run([sys.executable, str(runner), str(source), "--model", "base",
                       "--max-seconds", "900", "--out-dir",
                       str(self.root / job_id / "speech")], timeout=180)
        output = self.root / job_id / "speech" / "speech-transcript.txt"
        if result.returncode == 0 and output.is_file():
            job["speech"] = output.read_text(encoding="utf-8",errors="replace")[:50000]
            return job["speech"]
        return "Audio transcription unavailable on this server; no transcript fabricated."

    def delete(self, job_id: str) -> bool:
        with self.lock:
            existed = bool(self.jobs.pop(job_id, None))
            if existed:
                shutil.rmtree(self.root / job_id, ignore_errors=True)
            return existed
