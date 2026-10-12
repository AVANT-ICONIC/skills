"""Optional Whisper transcription (Groq preferred, OpenAI fallback, local CLI).

Adapted from the MIT-licensed `watch` skill (claude-watch, (c) 2026 Bradley
Bonanno; see ../NOTICE): load_api_key, extract_audio, _build_multipart,
_post_whisper, _segments_from_response, transcribe_audio.

Pure stdlib. Never required: callers must treat every failure as "no
Whisper transcript" and say so. Keys come from the environment
(GROQ_API_KEY / OPENAI_API_KEY) or ~/.config/watch/.env or ./.env.
"""
from __future__ import annotations

import io
import json
import mimetypes
import os
import shutil
import ssl
import subprocess
import time
import urllib.error
import uuid
from pathlib import Path
from urllib.request import Request, urlopen

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_MODEL = "whisper-large-v3"
OPENAI_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions"
OPENAI_MODEL = "whisper-1"
LOCAL_MODEL = os.environ.get("VIDEO_WATCH_LOCAL_WHISPER_MODEL", "base.en")
MAX_ATTEMPTS = 4
RETRY_BASE_DELAY = 2.0


class WhisperError(RuntimeError):
    pass


def _dotenv_value(path: Path, name: str) -> str | None:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        if key.strip() != name:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] in ('"', "'") and value[-1] == value[0]:
            value = value[1:-1]
        return value or None
    return None


def load_api_key(preferred: str | None = None, dotenv_paths: list[Path] | None = None) -> tuple[str | None, str | None]:
    """Return (backend, key). Groq first, then OpenAI; (None, None) if neither."""
    if dotenv_paths is None:
        dotenv_paths = [Path.home() / ".config" / "watch" / ".env", Path.cwd() / ".env"]
    candidates = (("GROQ_API_KEY", "groq"), ("OPENAI_API_KEY", "openai"))
    if preferred is not None:
        candidates = tuple(c for c in candidates if c[1] == preferred)
    for env_name, backend in candidates:
        value = (os.environ.get(env_name) or "").strip()
        if not value:
            for p in dotenv_paths:
                value = _dotenv_value(p, env_name) or ""
                if value:
                    break
        if value:
            return backend, value
    return None, None


def local_whisper_available() -> bool:
    return shutil.which("whisper") is not None


def extract_audio(video: Path, out_path: Path, seconds: float | None = None) -> Path:
    """Mono 16 kHz 64 kbps mp3 (about 480 kB/min), optionally the first `seconds`."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(Path(video).resolve()),
           "-vn", "-acodec", "libmp3lame", "-ar", "16000", "-ac", "1", "-b:a", "64k"]
    if seconds:
        cmd += ["-t", str(seconds)]
    cmd.append(str(out_path.resolve()))
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise WhisperError(f"ffmpeg audio extraction failed: {p.stderr.strip()[-300:]}")
    if not out_path.exists() or out_path.stat().st_size == 0:
        raise WhisperError("no audio track to transcribe")
    return out_path


def _build_multipart(fields: dict, file_path: Path) -> tuple[bytes, str]:
    boundary = f"----VideoWatchBoundary{uuid.uuid4().hex}"
    eol = b"\r\n"
    buf = io.BytesIO()
    for name, value in fields.items():
        buf.write(f"--{boundary}".encode() + eol)
        buf.write(f'Content-Disposition: form-data; name="{name}"'.encode() + eol + eol)
        buf.write(str(value).encode() + eol)
    mimetype = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    buf.write(f"--{boundary}".encode() + eol)
    buf.write(f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"'.encode() + eol)
    buf.write(f"Content-Type: {mimetype}".encode() + eol + eol)
    buf.write(file_path.read_bytes() + eol)
    buf.write(f"--{boundary}--".encode() + eol)
    return buf.getvalue(), boundary


def _post_whisper(endpoint: str, api_key: str, model: str, audio: Path, word_timestamps: bool = False) -> dict:
    fields = {"model": model, "response_format": "verbose_json", "temperature": "0"}
    if word_timestamps:
        fields["timestamp_granularities[]"] = "word"
    body, boundary = _build_multipart(fields, audio)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        # Groq sits behind a WAF that rejects the default urllib user agent.
        "User-Agent": "video-watch/1.0 (python-urllib)",
    }
    ctx = ssl.create_default_context()
    last = ""
    for attempt in range(MAX_ATTEMPTS):
        req = Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urlopen(req, timeout=300, context=ctx) as resp:
                payload = resp.read().decode("utf-8", errors="replace")
            try:
                return json.loads(payload)
            except json.JSONDecodeError as exc:
                raise WhisperError(f"Whisper returned non-JSON: {payload[:200]}") from exc
        except urllib.error.HTTPError as exc:
            last = f"HTTP {exc.code}"
            if 400 <= exc.code < 500 and exc.code != 429:
                raise WhisperError(f"Whisper request failed: {last}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last = type(exc).__name__
        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(RETRY_BASE_DELAY * (2 ** attempt))
    raise WhisperError(f"Whisper request failed after {MAX_ATTEMPTS} attempts: {last}")


def segments_from_response(data: dict) -> list[dict]:
    """Whisper verbose_json -> [{start, end, text}]."""
    out = []
    for seg in data.get("segments") or []:
        text = (seg.get("text") or "").strip()
        if text:
            out.append({"start": round(float(seg.get("start") or 0.0), 2),
                        "end": round(float(seg.get("end") or 0.0), 2), "text": text})
    if not out:
        full = (data.get("text") or "").strip()
        if full:
            out.append({"start": 0.0, "end": 0.0, "text": full})
    return out


def words_from_response(data: dict) -> list[dict]:
    """Collect word-level timestamps from top-level words or nested segment words."""
    raw = list(data.get("words") or [])
    for seg in data.get("segments") or []:
        raw.extend(seg.get("words") or [])
    out = []
    for w in raw:
        text = (w.get("word") or "").strip()
        if text:
            out.append({"word": text, "start": round(float(w.get("start") or 0.0), 3),
                        "end": round(float(w.get("end") or 0.0), 3)})
    return out


def _transcribe_local(audio: Path, word_timestamps: bool) -> dict:
    cmd = ["whisper", str(audio), "--model", LOCAL_MODEL, "--output_format", "json",
           "--output_dir", str(audio.parent), "--verbose", "False", "--fp16", "False"]
    if LOCAL_MODEL.endswith(".en"):
        cmd += ["--language", "en"]
    if word_timestamps:
        cmd += ["--word_timestamps", "True"]
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = audio.parent / (audio.stem + ".json")
    if p.returncode != 0 or not out.exists():
        raise WhisperError(f"local whisper failed: {(p.stderr or '')[-300:]}")
    return json.loads(out.read_text(encoding="utf-8"))


def transcribe_audio(audio: Path, backend: str | None = None, api_key: str | None = None,
                     word_timestamps: bool = False) -> tuple[list[dict], str, list[dict]]:
    """Return (segments, backend_used, words). Raises WhisperError on failure.

    The local `whisper` CLI is used only when backend == "local" is requested
    explicitly (it is slow and may download a model, so never implicit).
    """
    if backend is None or api_key is None:
        b, k = load_api_key()
        backend, api_key = backend or b, api_key or k
    if backend == "local":
        if not local_whisper_available():
            raise WhisperError("local whisper CLI not found on PATH")
        data = _transcribe_local(audio, word_timestamps)
    elif backend == "groq" and api_key:
        data = _post_whisper(GROQ_ENDPOINT, api_key, GROQ_MODEL, audio, word_timestamps)
    elif backend == "openai" and api_key:
        data = _post_whisper(OPENAI_ENDPOINT, api_key, OPENAI_MODEL, audio, word_timestamps)
    else:
        raise WhisperError("no Whisper backend available (set GROQ_API_KEY or OPENAI_API_KEY)")
    segments = segments_from_response(data)
    if not segments:
        raise WhisperError("Whisper returned no transcript segments")
    return segments, backend, words_from_response(data) if word_timestamps else []
