#!/usr/bin/env python3
"""Optional zero-API-key speech transcription of legally acquired local media.

Needs faster-whisper (pip install faster-whisper), ffmpeg, and local/hosted CPU.
The model weights are downloaded on first use; it is *not* bundled with the skill.
No transcript is synthesized if the media cannot be opened or no speech is found.
"""
from __future__ import annotations
import argparse
import json
import subprocess
import sys
from pathlib import Path

def transcribe(source: Path, out_dir: Path, model_name: str, language: str | None,
               max_seconds: int) -> dict:
    if not source.is_file() or not source.stat().st_size:
        raise ValueError("Input media not found or empty")
    if model_name not in {"tiny", "base", "small", "medium"}:
        raise ValueError("Unsupported model tier")
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError("faster-whisper not installed in this runtime") from exc
    # Probe video duration, fail closed for excessive runtime/cost.
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1", str(source)],
                       capture_output=True, text=True, timeout=20)
    if p.returncode != 0:
        raise RuntimeError("ffprobe cannot read media")
    duration = float(p.stdout.strip())
    if not 0 < duration <= max_seconds:
        raise ValueError(f"Duration outside permitted range (max {max_seconds} s)")
    out_dir.mkdir(parents=True, exist_ok=True)
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, info = model.transcribe(str(source), language=language,
                                     beam_size=3, vad_filter=True)
    all_segments = [
        {"start": round(seg.start, 2), "end": round(seg.end, 2),
         "text": seg.text.strip()}
        for seg in segments if seg.text and seg.text.strip()
    ]
    data = {"engine": "faster-whisper", "model": model_name, "duration": duration,
            "language": info.language, "language_probability": round(info.language_probability, 3),
            "segments": all_segments, "speech_detected": bool(all_segments)}
    (out_dir / "speech-transcript.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if all_segments:
        lines = [f"[{part['start']:.2f}-{part['end']:.2f}] {part['text']}" for part in all_segments]
        (out_dir / "speech-transcript.txt").write_text(
            "\n".join(lines) + "\n", encoding="utf-8")
    return data

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("media", type=Path)
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--model", default="base", choices=("tiny", "base", "small", "medium"))
    ap.add_argument("--language", default=None)
    ap.add_argument("--max-seconds", type=int, default=1800)
    ns = ap.parse_args()
    try:
        result = transcribe(ns.media, ns.out_dir, ns.model, ns.language, ns.max_seconds)
        print(json.dumps({"speech_detected": result["speech_detected"],
                          "segments": len(result["segments"]), "model": ns.model,
                          "language": result["language"]}))
        return 0
    except (ValueError, RuntimeError, OSError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
