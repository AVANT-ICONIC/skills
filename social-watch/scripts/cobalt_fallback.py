"""Optional authenticated LOCAL cobalt API fallback for public media.

The Cobalt server is an independent AGPL-3.0 project (not vendored here).
No use of public third-party API instances. Tunnel-only media URLs, same-origin,
no redirects and bounded downloads; fail closed for unexpected responses.
"""
from __future__ import annotations

import json
import mimetypes
import os
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit


class RejectRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(RejectRedirect)
LOCAL_HOSTS = {"127.0.0.1", "localhost", "cobalt"}
MAX_FILE = 250 * 1024 * 1024
MAX_ITEMS = 15
ACCEPTED_TYPES = {
    "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov",
    "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
    "image/gif": ".gif", "audio/mpeg": ".mp3",
}


def base_origin(url: str) -> str:
    parts = urlsplit(url.rstrip("/"))
    if (parts.scheme != "http" or parts.hostname not in LOCAL_HOSTS or
        parts.username or parts.password or parts.port != 9000 or parts.path not in ("", "/") or
        parts.query or parts.fragment):
        raise ValueError("Cobalt endpoint must be a local http://127.0.0.1:9000 or http://cobalt:9000 API")
    return f"http://{parts.hostname}:9000"


def local_media_url(value: str, expected: str) -> str:
    p = urlsplit(value)
    o = urlsplit(expected)
    if (p.scheme != "http" or p.hostname != o.hostname or p.port != o.port or
        p.username or p.password or not p.path.startswith("/") or p.fragment):
        raise ValueError("Cobalt returned a non-local media URL; refused")
    return value


def attempt(url: str, target: Path, cobalt_url: str, *, timeout: int = 25) -> list[str]:
    base = base_origin(cobalt_url)
    req = urllib.request.Request(
        base + "/",
        data=json.dumps({"url": url, "videoQuality": "720", "alwaysProxy": True,
                         "filenameStyle": "basic"}).encode("utf-8"),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        method="POST")
    key = os.environ.get("SOCIAL_WATCH_COBALT_API_KEY")
    if key:
        req.add_header("Authorization", "Api-Key " + key)
    with OPENER.open(req, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError("Cobalt returned non-success status")
        if "json" not in response.headers.get("content-type", ""):
            raise RuntimeError("Cobalt did not return JSON")
        data = response.read(1_000_001)
        if len(data) > 1_000_000:
            raise RuntimeError("Cobalt response exceeds metadata limit")
    body = json.loads(data)
    state = body.get("status")
    if state == "error":
        raise RuntimeError("Cobalt reported unsupported or unavailable media")
    if state == "tunnel":
        media = [body]
    elif state == "picker":
        media = body.get("picker", [])
    else:
        # Redirect to external CDN is not safe for this optional adapter.
        raise RuntimeError("Cobalt did not return a local tunnel/picker")
    target.mkdir(parents=True, exist_ok=True)
    saved = []
    for idx, item in enumerate(media[:MAX_ITEMS]):
        media_url = local_media_url(str(item.get("url", "")), base)
        r = urllib.request.Request(media_url, headers={"Accept": "*/*"})
        if key:
            r.add_header("Authorization", "Api-Key " + key)
        with OPENER.open(r, timeout=timeout) as response:
            if response.status != 200:
                raise RuntimeError("Cobalt media tunnel failed")
            kind = response.headers.get("content-type", "").split(";", 1)[0].lower().strip()
            suffix = ACCEPTED_TYPES.get(kind)
            if not suffix:
                raise RuntimeError("Unsupported Cobalt media content type")
            length = response.headers.get("Content-Length")
            if length and int(length) > MAX_FILE:
                raise RuntimeError("Cobalt media exceeds file size limit")
            path = target / f"cobalt_{idx:02d}{suffix}"
            pending = path.with_suffix(suffix + ".part")
            total = 0
            try:
                with pending.open("wb") as stream:
                    while True:
                        chunk = response.read(min(1024 * 1024, MAX_FILE + 1 - total))
                        if not chunk:
                            break
                        total += len(chunk)
                        if total > MAX_FILE:
                            raise RuntimeError("Cobalt media exceeded stream size limit")
                        stream.write(chunk)
                if total < 100:
                    raise RuntimeError("Cobalt returned empty media")
                pending.replace(path)
                saved.append(str(path.resolve()))
            finally:
                pending.unlink(missing_ok=True)
    return saved
