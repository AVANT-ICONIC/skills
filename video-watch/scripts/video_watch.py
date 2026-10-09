#!/usr/bin/env python3
"""Prepare a video for timestamped visual analysis.

The script acquires a local/remote video, extracts scene-change + temporal
coverage + dense opening frames, builds timestamped contact sheets, and emits a
manifest plus any native captions found by yt-dlp.

It deliberately does not call an LLM. The caller inspects the resulting
contact sheets with its image tool and combines them with the transcript.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlparse

MAX_SCENE_FRAMES = 48
DEFAULT_MAX_FRAMES = 72
HOOK_SECONDS = 10.0
HOOK_FPS = 2.0
SCENE_THRESHOLD = 0.30
DEDUP_SECONDS = 0.28
VIDEO_EXTS = {".mp4", ".mkv", ".webm", ".mov", ".m4v", ".avi", ".flv", ".wmv"}


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if check and p.returncode != 0:
        msg = p.stderr.strip() or p.stdout.strip() or f"exit {p.returncode}"
        raise RuntimeError(f"command failed: {' '.join(cmd[:4])}...\n{msg}")
    return p


def is_url(value: str) -> bool:
    p = urlparse(value)
    return p.scheme in {"http", "https"} and bool(p.netloc)


def fmt_time(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    total_ms = int(round(seconds * 1000))
    total_s, ms = divmod(total_ms, 1000)
    h, rem = divmod(total_s, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}.{ms:03d}"
    return f"{m:02d}:{s:02d}.{ms:03d}"


def parse_time(value: str | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    parts = text.split(":")
    try:
        if len(parts) == 1:
            return float(parts[0])
        if len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    except ValueError:
        pass
    raise ValueError(f"invalid time {value!r}; use SS, MM:SS, or HH:MM:SS")


def slug_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()[:12]


def probe(video: Path) -> dict:
    if not shutil.which("ffprobe"):
        raise RuntimeError("ffprobe is required")
    p = run([
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", "-show_streams", str(video),
    ])
    data = json.loads(p.stdout or "{}")
    streams = data.get("streams", [])
    vs = next((s for s in streams if s.get("codec_type") == "video"), {})
    fmt = data.get("format", {})
    duration = float(fmt.get("duration") or vs.get("duration") or 0.0)
    return {
        "duration_seconds": duration,
        "width": vs.get("width"),
        "height": vs.get("height"),
        "codec": vs.get("codec_name"),
    }


def locate_yt_dlp(explicit: str | None) -> str | None:
    candidates = []
    if explicit:
        candidates.append(explicit)
    env = os.environ.get("YT_DLP_BIN")
    if env:
        candidates.append(env)
    found = shutil.which("yt-dlp")
    if found:
        candidates.append(found)
    for c in candidates:
        p = Path(c).expanduser()
        if p.exists() and os.access(p, os.X_OK):
            return str(p.resolve())
    return None


def pick_video(directory: Path) -> Path | None:
    files = [p for p in directory.glob("video.*") if p.suffix.lower() in VIDEO_EXTS]
    if not files:
        files = [p for p in directory.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXTS]
    return sorted(files)[0] if files else None


def pick_caption(directory: Path) -> Path | None:
    caps = sorted(directory.glob("video*.vtt"))
    if not caps:
        return None
    preferred = []
    for token in (".en", ".de", "orig"):
        preferred.extend([p for p in caps if token in p.name.lower()])
    return preferred[0] if preferred else caps[0]


def acquire(source: str, work: Path, yt_dlp: str | None, sub_langs: str) -> tuple[Path, Path | None, dict]:
    if not is_url(source):
        p = Path(source).expanduser().resolve()
        if not p.exists():
            raise RuntimeError(f"video file not found: {p}")
        return p, None, {"title": p.name, "source": str(p), "downloaded": False}

    if not yt_dlp:
        raise RuntimeError("yt-dlp is required for URL sources; provide --yt-dlp or YT_DLP_BIN")

    d = work / "download"
    d.mkdir(parents=True, exist_ok=True)
    template = str(d / "video.%(ext)s")
    cmd = [
        yt_dlp,
        "--no-playlist",
        "--no-progress",
        "--write-info-json",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs", sub_langs,
        "--sub-format", "vtt",
        "--convert-subs", "vtt",
        "-f", "bv*[height<=720]+ba/b[height<=720]",
        "--merge-output-format", "mp4",
        "-o", template,
        "--", source,
    ]
    p = run(cmd, check=False)
    video = pick_video(d)
    if video is None:
        msg = p.stderr.strip() or p.stdout.strip() or f"yt-dlp exit {p.returncode}"
        raise RuntimeError(f"yt-dlp did not produce a video file\n{msg}")

    info = {"title": video.name, "source": source, "downloaded": True}
    info_path = d / "video.info.json"
    if info_path.exists():
        try:
            raw = json.loads(info_path.read_text(encoding="utf-8"))
            info.update({
                "title": raw.get("title") or info["title"],
                "uploader": raw.get("uploader") or raw.get("channel"),
                "webpage_url": raw.get("webpage_url") or source,
            })
        except Exception:
            pass
    return video.resolve(), pick_caption(d), info


def parse_showinfo(stderr: str) -> list[float]:
    out: list[float] = []
    rx = re.compile(r"\bpts_time:([0-9.+-]+)")
    for line in stderr.splitlines():
        m = rx.search(line)
        if m:
            try:
                out.append(float(m.group(1)))
            except ValueError:
                pass
    return out


def extract_scene_frames(video: Path, out_dir: Path, duration: float, max_frames: int, width: int, offset: float = 0.0) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.jpg"):
        f.unlink()
    pattern = str(out_dir / "scene_%04d.jpg")
    vf = f"select='eq(n\\,0)+gt(scene\\,{SCENE_THRESHOLD})',showinfo,scale={width}:-2"
    p = run([
        "ffmpeg", "-hide_banner", "-loglevel", "info", "-y",
        "-i", str(video), "-vf", vf, "-vsync", "vfr",
        "-frames:v", str(max_frames), "-q:v", "4", pattern,
    ], check=False)
    if p.returncode != 0:
        return []
    paths = sorted(out_dir.glob("scene_*.jpg"))
    times = parse_showinfo(p.stderr)
    if len(times) < len(paths):
        step = duration / max(1, len(paths))
        times.extend([i * step for i in range(len(times), len(paths))])
    return [
        {"path": str(path.resolve()), "timestamp_seconds": round(offset + times[i], 3), "kind": "scene"}
        for i, path in enumerate(paths)
    ]


def uniform_count(duration: float) -> int:
    if duration <= 30:
        return 8
    if duration <= 180:
        return 10
    if duration <= 600:
        return 12
    if duration <= 1800:
        return 16
    return 20


def extract_uniform_frames(video: Path, out_dir: Path, duration: float, count: int, width: int, offset: float = 0.0) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.jpg"):
        f.unlink()
    count = max(1, min(count, 24))
    if duration <= 0:
        timestamps = [0.0]
    elif count == 1:
        timestamps = [0.0]
    else:
        end = max(0.0, duration - min(0.25, duration * 0.01))
        timestamps = [end * i / (count - 1) for i in range(count)]

    frames: list[dict] = []
    for i, t in enumerate(timestamps):
        path = out_dir / f"coverage_{i:04d}.jpg"
        p = run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", f"{t:.3f}", "-i", str(video),
            "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "4", str(path),
        ], check=False)
        if p.returncode == 0 and path.exists():
            frames.append({"path": str(path.resolve()), "timestamp_seconds": round(offset + t, 3), "kind": "coverage"})
    return frames


def extract_hook_frames(video: Path, out_dir: Path, duration: float, width: int, offset: float = 0.0) -> list[dict]:
    if duration <= 0:
        return []
    hook_len = min(HOOK_SECONDS, duration)
    if hook_len < 2.0:
        return []
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.jpg"):
        f.unlink()
    pattern = str(out_dir / "hook_%04d.jpg")
    p = run([
        "ffmpeg", "-hide_banner", "-loglevel", "info", "-y",
        "-i", str(video), "-t", f"{hook_len:.3f}",
        "-vf", f"select='eq(n\\,0)+gte(t-prev_selected_t\\,{1 / HOOK_FPS})',showinfo,scale={width}:-2",
        "-vsync", "vfr", "-q:v", "4", pattern,
    ], check=False)
    if p.returncode != 0:
        return []
    paths = sorted(out_dir.glob("hook_*.jpg"))
    times = parse_showinfo(p.stderr)
    if len(times) < len(paths):
        return []
    return [
        {"path": str(path.resolve()), "timestamp_seconds": round(offset + times[i], 3), "kind": "hook"}
        for i, path in enumerate(paths)
    ]


def dedupe_by_time(frames: list[dict], tolerance: float = DEDUP_SECONDS) -> list[dict]:
    priority = {"scene": 3, "hook": 2, "coverage": 1}
    ordered = sorted(frames, key=lambda x: (x["timestamp_seconds"], -priority.get(x["kind"], 0)))
    out: list[dict] = []
    for f in ordered:
        if out and abs(f["timestamp_seconds"] - out[-1]["timestamp_seconds"]) <= tolerance:
            if priority.get(f["kind"], 0) > priority.get(out[-1]["kind"], 0):
                out[-1] = f
            continue
        out.append(f)
    return out


def even_pick(items: list[dict], n: int) -> list[dict]:
    if n <= 0 or not items:
        return []
    if len(items) <= n:
        return items[:]
    if n == 1:
        return [items[len(items) // 2]]
    idxs = sorted({round(i * (len(items) - 1) / (n - 1)) for i in range(n)})
    return [items[i] for i in idxs]


def enforce_budget(frames: list[dict], max_frames: int) -> list[dict]:
    frames = dedupe_by_time(frames)
    if len(frames) <= max_frames:
        return frames

    hooks = [f for f in frames if f["kind"] == "hook"]
    coverage = [f for f in frames if f["kind"] == "coverage"]
    scenes = [f for f in frames if f["kind"] == "scene"]

    keep: list[dict] = []
    keep.extend(even_pick(hooks, min(len(hooks), min(20, max_frames // 3))))
    remaining = max_frames - len(keep)
    keep.extend(even_pick(coverage, min(len(coverage), max(0, min(20, remaining)))))
    remaining = max_frames - len(keep)
    keep.extend(even_pick(scenes, remaining))

    keep = dedupe_by_time(keep)
    if len(keep) < max_frames:
        selected_paths = {f["path"] for f in keep}
        extras = [f for f in frames if f["path"] not in selected_paths]
        keep.extend(even_pick(extras, max_frames - len(keep)))
    return sorted(dedupe_by_time(keep), key=lambda x: x["timestamp_seconds"])[:max_frames]


VTT_TS_RE = re.compile(
    r"(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s+-->\s+(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})"
)
TAG_RE = re.compile(r"<[^>]+>")


def _vtt_seconds(groups: tuple[str | None, ...], start: int) -> float:
    h = int(groups[start] or 0)
    m = int(groups[start + 1])
    s = int(groups[start + 2])
    ms = int(groups[start + 3])
    return h * 3600 + m * 60 + s + ms / 1000.0


def parse_vtt(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    segs: list[dict] = []
    i = 0
    while i < len(lines):
        m = VTT_TS_RE.search(lines[i])
        if not m:
            i += 1
            continue
        g = m.groups()
        start = _vtt_seconds(g, 0)
        end = _vtt_seconds(g, 4)
        i += 1
        parts: list[str] = []
        while i < len(lines) and lines[i].strip():
            clean = html.unescape(TAG_RE.sub("", lines[i])).strip()
            if clean:
                parts.append(clean)
            i += 1
        text = " ".join(parts).strip()
        if text:
            segs.append({"start": start, "end": end, "text": text})
        i += 1

    out: list[dict] = []
    for seg in segs:
        if out and seg["text"] == out[-1]["text"]:
            out[-1]["end"] = max(out[-1]["end"], seg["end"])
        elif out and seg["text"].startswith(out[-1]["text"] + " "):
            out[-1]["text"] = seg["text"]
            out[-1]["end"] = seg["end"]
        else:
            out.append(seg)
    return out


def write_transcript(caption: Path | None, out_path: Path, start: float | None = None, end: float | None = None) -> tuple[int, str | None]:
    if not caption or not caption.exists():
        return 0, None
    segs = parse_vtt(caption)
    if start is not None or end is not None:
        lo = start if start is not None else float("-inf")
        hi = end if end is not None else float("inf")
        segs = [seg for seg in segs if seg["end"] >= lo and seg["start"] <= hi]
    lines = []
    for s in segs:
        lines.append(f"[{fmt_time(s['start'])}] {s['text']}")
    out_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
    return len(segs), str(out_path.resolve())


def build_contact_sheets(frames: list[dict], out_dir: Path, cols: int = 4, rows: int = 3, thumb_w: int = 384) -> list[dict]:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception as exc:
        raise RuntimeError(f"Pillow is required to build contact sheets: {exc}")

    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("sheet_*.jpg"):
        f.unlink()

    per_sheet = cols * rows
    font = ImageFont.load_default()
    sheets: list[dict] = []
    for sheet_idx in range(math.ceil(len(frames) / per_sheet)):
        chunk = frames[sheet_idx * per_sheet:(sheet_idx + 1) * per_sheet]
        opened = []
        max_h = 0
        for f in chunk:
            img = Image.open(f["path"]).convert("RGB")
            ratio = thumb_w / img.width
            h = max(1, int(round(img.height * ratio)))
            img = img.resize((thumb_w, h))
            opened.append((f, img))
            max_h = max(max_h, h)

        label_h = 30
        cell_h = max_h + label_h
        canvas = Image.new("RGB", (cols * thumb_w, rows * cell_h), "black")
        draw = ImageDraw.Draw(canvas)
        refs = []
        for j, (f, img) in enumerate(opened):
            r, c = divmod(j, cols)
            x = c * thumb_w
            y = r * cell_h
            canvas.paste(img, (x, y))
            label = f"#{sheet_idx * per_sheet + j + 1:02d}  {fmt_time(f['timestamp_seconds'])}  {f['kind']}"
            draw.rectangle((x, y + max_h, x + thumb_w, y + cell_h), fill="black")
            draw.text((x + 8, y + max_h + 8), label, fill="white", font=font)
            refs.append({
                "global_index": sheet_idx * per_sheet + j + 1,
                "timestamp_seconds": f["timestamp_seconds"],
                "kind": f["kind"],
                "frame_path": f["path"],
            })
        sheet_path = out_dir / f"sheet_{sheet_idx + 1:02d}.jpg"
        canvas.save(sheet_path, "JPEG", quality=88, optimize=True)
        sheets.append({"path": str(sheet_path.resolve()), "frames": refs})
    return sheets


def write_manifest(work: Path, source: str, video: Path, info: dict, meta: dict,
                   frames: list[dict], sheets: list[dict], transcript_path: str | None,
                   transcript_segments: int, focus: dict | None = None) -> Path:
    manifest = {
        "source": source,
        "workdir": str(work.resolve()),
        "video_path": str(video.resolve()),
        "info": info,
        "metadata": meta,
        "focus": focus,
        "sampling": {
            "strategy": "hybrid-scene-coverage-hook",
            "scene_threshold": SCENE_THRESHOLD,
            "hook_seconds": HOOK_SECONDS,
            "hook_fps": HOOK_FPS,
            "frame_count": len(frames),
            "contact_sheet_count": len(sheets),
        },
        "frames": frames,
        "contact_sheets": sheets,
        "transcript_path": transcript_path,
        "transcript_segments": transcript_segments,
    }
    path = work / "manifest.json"
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    md = work / "manifest.md"
    lines = [
        "# Video Watch Manifest",
        "",
        f"- Source: {source}",
        f"- Title: {info.get('title') or video.name}",
        f"- Duration: {fmt_time(meta.get('duration_seconds', 0))}",
        f"- Focus: {fmt_time(focus['start_seconds'])} -> {fmt_time(focus['end_seconds'])}" if focus else "- Focus: full video",
        f"- Resolution: {meta.get('width')}x{meta.get('height')}",
        f"- Frames selected: {len(frames)}",
        f"- Contact sheets: {len(sheets)}",
        f"- Transcript segments: {transcript_segments}",
        "",
        "## Contact sheets",
    ]
    for s in sheets:
        first = s["frames"][0]["timestamp_seconds"] if s["frames"] else 0
        last = s["frames"][-1]["timestamp_seconds"] if s["frames"] else 0
        lines.append(f"- {s['path']} ({fmt_time(first)} -> {fmt_time(last)})")
    if transcript_path:
        lines += ["", "## Transcript", f"- {transcript_path}"]
    lines += ["", "## Frame index"]
    for i, f in enumerate(frames, 1):
        lines.append(f"- #{i:02d} {fmt_time(f['timestamp_seconds'])} [{f['kind']}] {f['path']}")
    md.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> int:
    ap = argparse.ArgumentParser(description="Prepare a video for frame + transcript analysis")
    ap.add_argument("source", help="Local video path or yt-dlp supported URL")
    ap.add_argument("--out-dir", default=None, help="Output directory. Default: temporary directory per run")
    ap.add_argument("--yt-dlp", default=None, help="Path to yt-dlp binary for URL sources")
    ap.add_argument("--sub-langs", default="en.*,de.*,.*orig.*", help="yt-dlp subtitle language expression")
    ap.add_argument("--max-frames", type=int, default=DEFAULT_MAX_FRAMES)
    ap.add_argument("--frame-width", type=int, default=720)
    ap.add_argument("--sheet-thumb-width", type=int, default=384)
    ap.add_argument("--start", default=None, help="Focus start: SS, MM:SS, or HH:MM:SS")
    ap.add_argument("--end", default=None, help="Focus end: SS, MM:SS, or HH:MM:SS")
    args = ap.parse_args()

    if args.max_frames < 1 or args.frame_width < 1 or args.sheet_thumb_width < 1:
        ap.error("frame count and widths must be positive")

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print(json.dumps({"status": "needs_ffmpeg", "message": "ffmpeg and ffprobe are required"}))
        return 2

    work = Path(args.out_dir).expanduser().resolve() if args.out_dir else Path(tempfile.mkdtemp(prefix="video-watch-"))
    work.mkdir(parents=True, exist_ok=True)
    yt_dlp = locate_yt_dlp(args.yt_dlp)

    try:
        video, caption, info = acquire(args.source, work, yt_dlp, args.sub_langs)
        original_meta = probe(video)
        original_duration = float(original_meta.get("duration_seconds") or 0.0)
        start = parse_time(args.start)
        end = parse_time(args.end)
        if start is not None and start < 0:
            raise ValueError("--start must be non-negative")
        if end is not None and end < 0:
            raise ValueError("--end must be non-negative")
        if start is not None and start >= original_duration:
            raise ValueError("--start is past the end of the video")
        if end is not None and start is not None and end <= start:
            raise ValueError("--end must be greater than --start")

        analysis_video = video
        offset = 0.0
        focus = None
        if start is not None or end is not None:
            lo = start if start is not None else 0.0
            hi = min(end if end is not None else original_duration, original_duration)
            analysis_video = work / "focus.mp4"
            cmd = [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-ss", f"{lo:.3f}", "-i", str(video),
                "-t", f"{max(0.1, hi-lo):.3f}",
                "-map", "0:v:0", "-map", "0:a?",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
                "-c:a", "aac", str(analysis_video),
            ]
            run(cmd)
            offset = lo
            focus = {"start_seconds": lo, "end_seconds": hi}

        analysis_meta = probe(analysis_video)
        duration = float(analysis_meta.get("duration_seconds") or 0.0)
        meta = dict(original_meta)
        meta["analysis_duration_seconds"] = duration

        scene = extract_scene_frames(
            analysis_video, work / "frames_scene", duration,
            MAX_SCENE_FRAMES, args.frame_width, offset,
        )
        coverage = extract_uniform_frames(
            analysis_video, work / "frames_coverage", duration,
            uniform_count(duration), args.frame_width, offset,
        )
        hook = extract_hook_frames(
            analysis_video, work / "frames_hook", duration,
            args.frame_width, offset,
        )
        frames = enforce_budget(scene + coverage + hook, args.max_frames)
        if not frames:
            raise RuntimeError("No visual frames were extracted")

        sheets = build_contact_sheets(
            frames, work / "contact_sheets",
            thumb_w=args.sheet_thumb_width,
        )
        transcript_segments, transcript_path = write_transcript(
            caption, work / "transcript.txt", start, end
        )
        manifest_path = write_manifest(
            work, args.source, video, info, meta, frames, sheets,
            transcript_path, transcript_segments, focus,
        )
        result = {
            "status": "ready",
            "workdir": str(work),
            "manifest": str(manifest_path),
            "manifest_md": str(work / "manifest.md"),
            "contact_sheets": [s["path"] for s in sheets],
            "transcript": transcript_path,
            "frame_count": len(frames),
            "duration_seconds": original_duration,
            "analysis_duration_seconds": duration,
            "focus": focus,
            "title": info.get("title"),
        }
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({
            "status": "error",
            "message": str(exc),
            "workdir": str(work),
        }, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
