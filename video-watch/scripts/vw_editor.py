"""Editor-mode analysis: pacing metrics, hook microscope words, report.md, export.

Adapted from the MIT-licensed `watch` skill (claude-watch, (c) 2026 Bradley
Bonanno; see ../NOTICE): compute_pacing (pacing.py), hook_words (hook.py),
write_report (report.py). detect_scene_times, transcript_from_segments,
pick_hero_frames and export_report are new.
"""
from __future__ import annotations

import datetime as _dt
import re
import shutil
import statistics
import subprocess
from pathlib import Path

import vw_whisper

HOOK_SECONDS = 10.0


def _mmss(seconds: float) -> str:
    total = int(round(seconds))
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def detect_scene_times(video: Path, threshold: float, offset: float = 0.0) -> list[float]:
    """Timestamps of every scene change (uncapped, no frames written). New."""
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "info", "-i", str(video), "-an",
         "-vf", f"select='gt(scene\\,{threshold})',showinfo", "-f", "null", "-"],
        capture_output=True, text=True)
    if p.returncode != 0:
        return []
    rx = re.compile(r"\bpts_time:([0-9.+-]+)")
    out = []
    for line in p.stderr.splitlines():
        m = rx.search(line)
        if m:
            try:
                out.append(round(offset + float(m.group(1)), 3))
            except ValueError:
                pass
    return sorted(out)


def compute_pacing(scene_times: list[float], video_duration: float, start: float = 0.0) -> dict:
    """Shot list plus cuts/min and shot-length stats (ported from watch pacing.py).

    scene_times are cut timestamps (each starts a new shot); shot 0 begins at
    `start`. Differences from upstream: cuts are counted from scene changes (a
    video with no cuts is one shot, not "no data"), and the motion-score stub
    was dropped.
    """
    if video_duration <= 0:
        return {"shot_count": 0, "cuts_per_minute": 0.0, "mean_shot_length": 0.0,
                "median_shot_length": 0.0, "shots": []}
    end_all = start + video_duration
    cuts = sorted(t for t in scene_times if start + 0.01 < t < end_all)
    starts = [start] + cuts
    shots = []
    for i, s in enumerate(starts):
        e = starts[i + 1] if i + 1 < len(starts) else end_all
        shots.append({"start_seconds": round(s, 2), "duration_seconds": round(max(0.0, e - s), 2)})
    durs = [s["duration_seconds"] for s in shots]
    return {
        "shot_count": len(shots),
        "cuts_per_minute": round(len(cuts) / (video_duration / 60.0), 2),
        "mean_shot_length": round(statistics.mean(durs), 2),
        "median_shot_length": round(statistics.median(durs), 2),
        "shots": shots,
    }


def _resolve_backend(backend, api_key, allow_local):
    """(backend, key); falls back to explicit "local" only when allow_local."""
    if backend is None or api_key is None:
        backend, api_key = vw_whisper.load_api_key()
    if not (backend and api_key) and allow_local and vw_whisper.local_whisper_available():
        return "local", None
    return backend, api_key


def hook_words(video: Path, work: Path, offset: float = 0.0, backend: str | None = None,
               api_key: str | None = None, allow_local: bool = False) -> dict:
    """Word-level Whisper over the first 10 s (ported from watch hook.py).

    Returns {"ran", "words", "backend", "note"}; never raises. Word times are
    shifted by `offset` so they match original-video time.
    """
    backend, api_key = _resolve_backend(backend, api_key, allow_local)
    if backend != "local" and not (backend and api_key):
        return {"ran": False, "words": [], "backend": None, "note": "no Whisper key; hook frames only"}
    try:
        audio = vw_whisper.extract_audio(video, work / "hook_audio.mp3", HOOK_SECONDS)
        _, used, words = vw_whisper.transcribe_audio(audio, backend, api_key, word_timestamps=True)
    except (vw_whisper.WhisperError, OSError) as exc:
        return {"ran": False, "words": [], "backend": backend, "note": f"hook words failed: {exc}"}
    for w in words:
        w["start"] = round(w["start"] + offset, 3)
        w["end"] = round(w["end"] + offset, 3)
    return {"ran": True, "words": words, "backend": used, "note": None}


def transcribe_full(video: Path, work: Path, offset: float = 0.0, backend: str | None = None,
                    api_key: str | None = None, allow_local: bool = False) -> tuple[list[dict], str | None, str | None]:
    """Whisper fallback for a missing caption track. Returns (segments, backend, error). New."""
    backend, api_key = _resolve_backend(backend, api_key, allow_local)
    if backend != "local" and not (backend and api_key):
        return [], None, "no captions and no Whisper key (GROQ_API_KEY / OPENAI_API_KEY)"
    try:
        audio = vw_whisper.extract_audio(video, work / "audio.mp3")
        segs, used, _ = vw_whisper.transcribe_audio(audio, backend, api_key)
    except (vw_whisper.WhisperError, OSError) as exc:
        return [], backend, str(exc)
    return [{"start": s["start"] + offset, "end": s["end"] + offset, "text": s["text"]} for s in segs], used, None


def pick_hero_frames(frames: list[dict], limit: int = 8) -> list[dict]:
    """Prefer scene-change frames, evenly thinned, in time order. New."""
    scene = [f for f in frames if f.get("kind") == "scene"] or list(frames)
    if len(scene) > limit:
        idx = sorted({round(i * (len(scene) - 1) / (limit - 1)) for i in range(limit)})
        scene = [scene[i] for i in idx]
    return sorted(scene, key=lambda f: f["timestamp_seconds"])


def _pending(hint: str) -> str:
    return f"<!-- pending agent fill: {hint} -->"


def write_report(out_path: Path, source: str, title: str, duration_seconds: float, intent: str,
                 transcript_segments: list[dict], transcript_source: str | None, all_frames: list[dict],
                 hero_frames: list[dict], pacing: dict, hook: dict,
                 watched_at: _dt.datetime | None = None) -> Path:
    """Deterministic report.md; narrative sections are pending markers (ported from report.py)."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    watched_at = watched_at or _dt.datetime.now().astimezone()
    hero_names = ", ".join(Path(f["path"]).name for f in hero_frames)
    L = ["---", f"source: {source}", f"title: {title}", f"duration: {_mmss(duration_seconds)}",
         f"watched_at: {watched_at.isoformat()}", f"intent: {intent or '(none)'}",
         f"hero_frames: [{hero_names}]", f"transcript_source: {transcript_source or 'none'}", "---", "",
         f"# {title}", "", "## TL;DR", "",
         _pending(f"3-5 bullets through the lens of: '{intent or 'general summary'}'"), "",
         "## Key moments", "",
         _pending("5-10 bullets `- **[MM:SS] label** - description`, citing inspected frames; label inference"), "",
         "## Hook microscope (0-10s)", ""]
    L.append(f"- Hook frames: {hook.get('frame_count', 0)} at 2 fps")
    words = hook.get("words", [])
    if words:
        L += [f"- Word-level transcript ({len(words)} words):", "", "```"]
        L += [f"  [{w['start']:6.2f}s] {w['word']}" for w in words]
        L.append("```")
    else:
        L.append(f"- Word timing: not available ({hook.get('note') or 'not run'})")
    L += ["", _pending("what changes visually at each 0.5s tick vs what is said; name the hook pattern, "
                       "marked as inference"), "", "## Editorial profile", ""]
    if pacing.get("shot_count", 0) > 0:
        L += [f"- Shots: {pacing['shot_count']}", f"- Cuts/min: {pacing['cuts_per_minute']}",
              f"- Mean shot length: {pacing['mean_shot_length']}s",
              f"- Median shot length: {pacing['median_shot_length']}s"]
    else:
        L.append("_No pacing data._")
    L += ["", _pending("one-line style fingerprint, inferred from pacing numbers and inspected frames"), "",
          "## Quotable moments", "",
          _pending("3-5 standalone lines from the transcript, each with [MM:SS]"), "",
          "## Entities mentioned", "",
          "- People: " + _pending("comma-separated"), "- Companies: " + _pending("comma-separated"),
          "- Tools / products: " + _pending("comma-separated"), "", "## Concepts surfaced", "",
          _pending("concept: one-line gist"), "", "## Transcript", ""]
    if transcript_segments:
        L += [f"_Source: {transcript_source or 'unknown'}._", "", "```"]
        L += [f"[{_mmss(s.get('start', 0))}] {s.get('text', '').strip()}" for s in transcript_segments]
        L.append("```")
    else:
        L.append("_No transcript available._")
    L += ["", "## All frames", "", f"_Total: {len(all_frames)}. Hero frames marked with *._", ""]
    hero_paths = {f["path"] for f in hero_frames}
    for f in all_frames:
        L.append(f"{'* ' if f['path'] in hero_paths else '  '}`{f['path']}` (t={_mmss(f['timestamp_seconds'])})")
    L.append("")
    out_path.write_text("\n".join(L), encoding="utf-8")
    return out_path


def slugify(text: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-").lower()
    return s[:60] or "video"


def export_report(report: Path, export_dir: Path, title: str, hero_frames: list[dict]) -> Path:
    """Copy report.md and hero frames into a caller-chosen folder (e.g. a notes vault). New.

    The report is rewritten to point at the copied frames by relative path.
    """
    dest = export_dir.expanduser().resolve() / slugify(title)
    (dest / "frames").mkdir(parents=True, exist_ok=True)
    text = report.read_text(encoding="utf-8")
    for f in hero_frames:
        src = Path(f["path"])
        shutil.copy2(src, dest / "frames" / src.name)
        text = text.replace(f["path"], f"frames/{src.name}")
    out = dest / "report.md"
    out.write_text(text, encoding="utf-8")
    return out
