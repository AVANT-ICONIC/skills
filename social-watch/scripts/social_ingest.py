#!/usr/bin/env python3
"""Bounded public social-media URL acquisition; no LLM, cookies or access bypass."""
from __future__ import annotations

import argparse
import json
import html
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

PLATFORMS = {
    "youtube": {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be",
                "youtube-nocookie.com", "www.youtube-nocookie.com"},
    "instagram": {"instagram.com", "www.instagram.com", "m.instagram.com"},
    "tiktok": {"tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"},
    "x": {"x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"},
    "facebook": {"facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com",
                 "fb.watch", "www.fb.watch"},
    "reddit": {"reddit.com", "www.reddit.com", "old.reddit.com", "new.reddit.com",
               "redd.it", "www.redd.it", "v.redd.it", "www.v.redd.it"},
}
MEDIA_EXTS = {".mp4", ".mkv", ".webm", ".mov", ".m4v", ".mp3", ".m4a", ".jpg",
              ".jpeg", ".png", ".webp", ".gif"}
CAPTION_EXTS = {".vtt", ".srt", ".ass"}
TRACKING_PARAMS = {"fbclid", "gclid", "igsh", "igshid", "si", "feature", "ref_src"}


def identify(url: str) -> tuple[str, str]:
    """Return (platform, normalized URL). Reject unlisted and ambiguous hosts."""
    parts = urlsplit(url.strip())
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
        raise ValueError("Expected an http(s) URL without embedded credentials")
    if parts.port is not None and parts.port != 443:
        raise ValueError("Custom ports are not allowed")
    host = parts.hostname.lower().rstrip(".")
    platform = next((p for p, hosts in PLATFORMS.items() if host in hosts), None)
    if not platform:
        raise ValueError("Unsupported hostname; exact social host allowlist only")
    path = parts.path or "/"
    singular = {
        "youtube": path.startswith(("/watch", "/shorts/", "/embed/", "/live/")) or host.endswith("youtu.be"),
        "instagram": path.startswith(("/p/", "/reel/", "/reels/", "/tv/")),
        "tiktok": "/video/" in path or path.startswith(("/t/", "/share/video/")) or host.startswith(("vm.", "vt.")),
        "x": "/status/" in path,
        "facebook": host.endswith("fb.watch") or path.startswith(("/reel/", "/watch", "/share/r/",
                       "/share/v/", "/posts/", "/photos/", "/photo/", "/story.php", "/permalink.php"))
                       or "/videos/" in path or "/posts/" in path or "/photos/" in path,
        "reddit": "/comments/" in path or host.endswith("redd.it"),
    }
    if not singular[platform]:
        raise ValueError("Single post/video URLs only; use a platform reader for profiles or feeds")
    filtered = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
                if not k.lower().startswith("utm_") and k.lower() not in TRACKING_PARAMS]
    clean = urlunsplit(("https", host, path, urlencode(filtered), ""))
    return platform, clean


def command(argv: list[str], timeout: int) -> subprocess.CompletedProcess[str]:
    """Never shell=True; don't echo secrets or raw provider logs into manifests."""
    return subprocess.run(argv, check=False, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=timeout)



def classify_extractor_error(stderr: str) -> str:
    """Categorize errors without logging untrusted URLs, tokens or cookies."""
    message = stderr.lower()
    if "sign in to confirm" in message or "account authentication is required" in message:
        return "authentication_required"
    if "empty media response" in message:
        return "empty_media_response"
    if "http error 403" in message or "forbidden" in message:
        return "access_denied"
    if "not available" in message or "not found" in message or "deleted" in message:
        return "not_available"
    if "no supported javascript runtime" in message:
        return "missing_js_runtime"
    if "timed out" in message or "timeout" in message:
        return "timeout"
    return "extractor_failed" if message.strip() else "no_error_details"



def parse_json(output: str) -> dict:
    try:
        item = json.loads(output)
        return item if isinstance(item, dict) else {}
    except (ValueError, TypeError):
        return {}


def clean_meta(meta: dict) -> dict:
    safe = ("id", "title", "description", "uploader", "uploader_id", "channel",
            "duration", "timestamp", "release_timestamp", "upload_date",
            "webpage_url", "extractor_key")
    result = {k: meta[k] for k in safe
              if k in meta and isinstance(meta[k], (str, int, float, type(None)))}
    for k, v in result.items():
        if isinstance(v, str):
            result[k] = v[:24000 if k == "description" else 500]
    return result


def files_in(folder: Path) -> tuple[list[str], list[str]]:
    media, captions = [], []
    for f in sorted(folder.rglob("*")):
        if not f.is_file() or f.name == "manifest.json":
            continue
        if f.suffix.lower() in MEDIA_EXTS:
            media.append(str(f.resolve()))
        elif f.suffix.lower() in CAPTION_EXTS:
            captions.append(str(f.resolve()))
    return media, captions



def parse_caption_file(path: Path) -> list[dict]:
    """Normalize VTT/SRT cues; source captions may contain errors or non-speech cues."""
    if path.suffix.lower() not in CAPTION_EXTS or path.stat().st_size > 5_000_000:
        return []
    raw = path.read_text(encoding="utf-8-sig", errors="replace")
    lines = raw.splitlines()
    cues: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if "-->" not in line:
            i += 1
            continue
        start = line.split("-->", 1)[0].strip()
        i += 1
        parts = []
        while i < len(lines) and lines[i].strip():
            value = re.sub(r"<[^>]+>", "", lines[i].strip())
            value = html.unescape(value)
            if value and value not in parts:
                parts.append(value)
            i += 1
        caption = " ".join(parts).strip()
        if caption and (not cues or cues[-1]["text"] != caption):
            cues.append({"at": start, "text": caption})
        i += 1
    return cues[:2000]



def ingest(url: str, out_dir: Path, *, acquire_media: bool = False,
           timeout: int = 120) -> dict:
    platform, cleaned = identify(url)
    out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict = {
        "schema_version": "0.1", "source_url": cleaned, "platform": platform,
        "metadata": {}, "media_files": [], "caption_files": [], "caption_transcript_file": None,
        "text_evidence": [], "attempts": [], "warnings": [],
        "status": "unavailable", "visuals_inspected": False,
        "audio_transcribed": False, "comments_retrieved": False,
    }
    ytdlp = shutil.which("yt-dlp")
    gallery = shutil.which("gallery-dl")
    if not ytdlp and not gallery:
        manifest["warnings"].append(
            "No extractor installed. Use a native connector, hosted bridge, or install yt-dlp/gallery-dl in a networked runtime.")
    media_download_ok = False
    js_runtime = ["--js-runtimes", "node"] if shutil.which("node") else []
    if ytdlp:
        args = [ytdlp, "--ignore-config", *js_runtime, "--no-playlist", "--skip-download",
                "--dump-single-json", "--socket-timeout", "15", "--retries", "1", cleaned]
        try:
            p = command(args, timeout=min(timeout, 75))
            manifest["attempts"].append({"extractor": "yt-dlp", "stage": "metadata", "ok": p.returncode == 0,
                                         "reason": None if p.returncode == 0 else classify_extractor_error(p.stderr)})
            if p.returncode == 0:
                manifest["metadata"] = clean_meta(parse_json(p.stdout))
                if manifest["metadata"]:
                    manifest["status"] = "metadata_only"
                    description = manifest["metadata"].get("description")
                    if description:
                        manifest["text_evidence"].append({"type": "description", "text": description})
            else:
                manifest["warnings"].append("yt-dlp metadata failed; network/session/extractor restriction possible")
        except (OSError, subprocess.TimeoutExpired):
            manifest["attempts"].append({"extractor": "yt-dlp", "stage": "metadata", "ok": False})
            manifest["warnings"].append("yt-dlp metadata timed out or could not start")
        if acquire_media and manifest["attempts"][-1]["ok"]:
            args = [ytdlp, "--ignore-config", *js_runtime, "--no-playlist", "--no-progress",
                    "--socket-timeout", "15", "--retries", "1", "--fragment-retries", "1",
                    "--max-filesize", "250M",
                    "--write-subs", "--write-auto-subs", "--sub-langs", "en.*,de.*",
                    "--sub-format", "vtt", "--write-info-json",
                    "-f", "bv*[height<=720]+ba/b[height<=720]/best",
                    "--merge-output-format", "mp4", "-o", str(out_dir / "video.%(ext)s"), cleaned]
            try:
                q = command(args, timeout=timeout)
                manifest["attempts"].append({"extractor": "yt-dlp", "stage": "media", "ok": q.returncode == 0,
                                             "reason": None if q.returncode == 0 else classify_extractor_error(q.stderr)})
                media_download_ok = q.returncode == 0
                if q.returncode:
                    manifest["warnings"].append("yt-dlp media download failed; text may still be readable")
            except (OSError, subprocess.TimeoutExpired):
                manifest["attempts"].append({"extractor": "yt-dlp", "stage": "media", "ok": False})
                manifest["warnings"].append("yt-dlp download timed out or could not start")
    # Gallery fallback is bounded to a single URL and at most 20 post-media objects.
    # Success means media acquired, never that an image/video was actually inspected.
    if acquire_media and gallery and not media_download_ok:
        args = [gallery, "--config-ignore", "--directory", str(out_dir / "gallery"),
                "--range", "1-20", "--filesize-max", "50M", "--no-mtime",
                "--write-info-json", cleaned]
        try:
            p = command(args, timeout=timeout)
            manifest["attempts"].append({"extractor": "gallery-dl", "stage": "media", "ok": p.returncode == 0,
                                         "reason": None if p.returncode == 0 else classify_extractor_error(p.stderr)})
            media_download_ok = p.returncode == 0 and bool(files_in(out_dir / "gallery")[0])
            if p.returncode:
                manifest["warnings"].append("gallery-dl failed for this URL")
        except (OSError, subprocess.TimeoutExpired):
            manifest["attempts"].append({"extractor": "gallery-dl", "stage": "media", "ok": False})
            manifest["warnings"].append("gallery-dl timed out or could not start")
    # Optional independent private Cobalt instance. No public API is contacted.
    # Redirect-only responses and non-local tunnel URLs are rejected by adapter.
    cobalt_endpoint = os.environ.get("SOCIAL_WATCH_COBALT_URL")
    if acquire_media and cobalt_endpoint and not media_download_ok:
        try:
            from cobalt_fallback import attempt as cobalt_attempt
            files = cobalt_attempt(cleaned, out_dir / "cobalt", cobalt_endpoint,
                                   timeout=min(timeout, 25))
            media_download_ok = bool(files)
            manifest["attempts"].append({
                "extractor": "cobalt-local", "stage": "media", "ok": media_download_ok,
                "reason": None if files else "no_media"})
        except Exception:
            # Catch adapter/network JSON errors but never expose remote payload,
            # URLs, tokens or signed links in model-facing tool results.
            manifest["attempts"].append({
                "extractor": "cobalt-local", "stage": "media", "ok": False,
                "reason": "local_cobalt_error"})
            manifest["warnings"].append("Private Cobalt fallback did not produce usable media")
    if gallery and not manifest["metadata"]:
        for info_path in sorted((out_dir / "gallery").rglob("info.json"))[:3]:
            if info_path.stat().st_size > 200_000:
                continue
            try:
                item = json.loads(info_path.read_text(encoding="utf-8"))
                if not isinstance(item, dict):
                    continue
                # Gallery metadata often calls a post caption "content".
                for key in ("id", "title", "description", "content", "caption", "user"):
                    if key not in item or not isinstance(item[key], str):
                        continue
                    target = "description" if key in ("content", "caption") else ("uploader" if key == "user" else key)
                    manifest["metadata"][target] = item[key][:24000 if target == "description" else 500]
                if manifest["metadata"].get("description"):
                    manifest["text_evidence"].append({
                        "type": "gallery_post_caption",
                        "text": manifest["metadata"]["description"]})
                if manifest["metadata"]:
                    break
            except (OSError, ValueError):
                continue
    manifest["media_files"], manifest["caption_files"] = files_in(out_dir)

    if manifest["caption_files"]:
        cue_source = next((Path(p) for p in manifest["caption_files"]
                           if p.lower().endswith((".vtt", ".srt"))), None)
        if cue_source:
            cues = parse_caption_file(cue_source)
            if cues:
                transcript = out_dir / "caption-transcript.txt"
                transcript.write_text(
                    "\n".join(f"[{cue['at']}] {cue['text']}" for cue in cues) + "\n",
                    encoding="utf-8")
                manifest["caption_transcript_file"] = str(transcript.resolve())
                manifest["text_evidence"].append({
                    "type": "caption_track", "path": str(transcript.resolve()),
                    "cue_count": len(cues), "origin": "platform_caption_not_verified_speech"
                })
    if manifest["media_files"] and media_download_ok:
        manifest["status"] = "media_acquired_uninspected"
    elif manifest["media_files"]:
        manifest["warnings"].append("Only incomplete/unverified media files found after extractor failure")
        manifest["status"] = "partial_media_unverified"
    elif not manifest["metadata"] and platform == "reddit":
        manifest["warnings"].append("Text-only Reddit posts and comments require a readable page or authorized Reddit API")
    elif not manifest["metadata"] and platform == "x":
        manifest["warnings"].append("Text-only X posts and threads require a readable page or authorized connector")
    if acquire_media and not manifest["media_files"]:
        manifest["warnings"].append("No media acquired. Do not claim to have watched anything")
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                                           encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Gather bounded social post metadata and optional media")
    parser.add_argument("url", help="individual public URL on YouTube, Instagram, TikTok, X or Reddit")
    parser.add_argument("--download", action="store_true", help="download supported media")
    parser.add_argument("--out-dir", type=Path, help="caller-owned scratch; default private temp dir")
    parser.add_argument("--timeout", type=int, default=120, help="per-command seconds, 10-600")
    parser.add_argument("--identify-only", action="store_true", help="normalize without network or writes")
    args = parser.parse_args()
    try:
        platform, normalized = identify(args.url)
        if args.identify_only:
            print(json.dumps({"platform": platform, "url": normalized}))
            return 0
        if not 10 <= args.timeout <= 600:
            raise ValueError("timeout must be between 10 and 600 seconds")
        target = args.out_dir or Path(tempfile.mkdtemp(prefix="social-watch-"))
        manifest = ingest(normalized, target, acquire_media=args.download, timeout=args.timeout)
        print(json.dumps({"manifest": str((target / "manifest.json").resolve()),
                          "status": manifest["status"], "platform": platform,
                          "media_count": len(manifest["media_files"]),
                          "caption_count": len(manifest["caption_files"]),
                          "warnings": manifest["warnings"]}, ensure_ascii=False))
        return 0 if manifest["status"] in ("metadata_only", "media_acquired_uninspected") else 2
    except (ValueError, OSError) as error:
        print(json.dumps({"error": str(error)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
