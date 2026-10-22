"""Authorized Reddit Data API reader: one post, bounded comments, optional video.

Requires approved Reddit Data API access and a valid OAuth bearer token.
Does not scrape, impersonate a logged-in browser or fetch removed posts.
"""
from __future__ import annotations
import json
import base64
import threading
import time
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit, urlencode

MAX_API_JSON = 2_000_000
MAX_MEDIA = 120 * 1024 * 1024

class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None

OPENER = urllib.request.build_opener(NoRedirects)


def post_id(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.hostname not in (
            "reddit.com", "www.reddit.com", "old.reddit.com",
            "new.reddit.com", "redd.it", "www.redd.it"):
        raise ValueError("Reddit URL must use an allowed HTTPS hostname")
    m = re.search(r"/comments/([a-z0-9]{3,12})(?:/|$)",parts.path.lower())
    if not m:
        if parts.hostname.endswith("redd.it"):
            m = re.fullmatch(r"/([a-z0-9]{3,12})/?",parts.path.lower())
    if not m:
        raise ValueError("Cannot identify a single Reddit post")
    return m.group(1)


_TOKEN_LOCK = threading.Lock()
_TOKEN_CACHE: tuple[str, float] | None = None

def refresh_approved_token(client_id: str, client_secret: str,
                           refresh_token: str, user_agent: str) -> str:
    """Refresh a previously consented, approved Reddit Data API token."""
    global _TOKEN_CACHE
    with _TOKEN_LOCK:
        if _TOKEN_CACHE and time.monotonic() < _TOKEN_CACHE[1]:
            return _TOKEN_CACHE[0]
        body = urlencode({"grant_type": "refresh_token",
                          "refresh_token": refresh_token}).encode("ascii")
        basic = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
        req = urllib.request.Request(
            "https://www.reddit.com/api/v1/access_token",
            data=body, method="POST",
            headers={"Authorization": "Basic " + basic, "User-Agent": user_agent,
                     "Content-Type": "application/x-www-form-urlencoded",
                     "Accept": "application/json"})
        with OPENER.open(req, timeout=12) as reply:
            if reply.status != 200 or "json" not in reply.headers.get("Content-Type",""):
                raise RuntimeError("Approved Reddit OAuth refresh was rejected")
            payload = reply.read(8193)
            if len(payload) > 8192:
                raise RuntimeError("Reddit OAuth refresh response too large")
        parsed = json.loads(payload)
        token = parsed.get("access_token")
        expiry = parsed.get("expires_in")
        scopes = parsed.get("scope", "")
        if (not isinstance(token,str) or not 10 <= len(token) <= 4096 or
            not isinstance(expiry,(int,float)) or not 60 <= expiry <= 86400 or
            not isinstance(scopes,str) or "read" not in scopes.split()):
            raise RuntimeError("Reddit OAuth refresh lacks a valid read grant")
        _TOKEN_CACHE = (token, time.monotonic() + expiry - 30)
        return token


def approved_settings() -> tuple[str, str] | None:
    token = os.environ.get("SOCIAL_WATCH_REDDIT_OAUTH_TOKEN", "").strip()
    user_agent = os.environ.get("SOCIAL_WATCH_REDDIT_USER_AGENT", "").strip()
    fields = tuple(os.environ.get(n, "").strip() for n in (
        "SOCIAL_WATCH_REDDIT_CLIENT_ID",
        "SOCIAL_WATCH_REDDIT_CLIENT_SECRET",
        "SOCIAL_WATCH_REDDIT_REFRESH_TOKEN"))
    if not any((token, user_agent, *fields)):
        return None
    if not user_agent or not (16 <= len(user_agent) <= 255 and "(by /u/" in user_agent):
        raise ValueError("Reddit requires an honest, descriptive User-Agent")
    if not token:
        if not all(fields):
            raise ValueError("Approved Reddit OAuth needs a token or all three refresh credentials")
        token = refresh_approved_token(*fields, user_agent)
    if not 10 <= len(token) <= 4096:
        raise ValueError("Invalid approved Reddit OAuth token")
    return token, user_agent

def _fetch(url: str, token: str, user_agent: str, *, binary: bool = False) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={
        "User-Agent": user_agent, "Authorization": "Bearer " + token,
        "Accept": "video/mp4" if binary else "application/json",
    })
    with OPENER.open(req, timeout=15) as reply:
        if reply.status != 200:
            raise RuntimeError("Reddit API/media request returned non-success status")
        kind = reply.headers.get("Content-Type", "").split(";",1)[0].lower()
        if binary and kind not in ("video/mp4", "application/octet-stream"):
            raise RuntimeError("Reddit media did not return MP4")
        if not binary and kind not in ("application/json", "application/javascript"):
            raise RuntimeError("Reddit API did not return JSON")
        size_limit = MAX_MEDIA if binary else MAX_API_JSON
        content_len = reply.headers.get("Content-Length")
        if content_len and int(content_len) > size_limit:
            raise RuntimeError("Reddit response exceeds size limit")
        buf = reply.read(size_limit + 1)
        if len(buf) > size_limit:
            raise RuntimeError("Reddit response exceeds byte limit")
        return buf, kind


def read_post(url: str, token: str, user_agent: str) -> dict:
    ident = post_id(url)
    endpoint = f"https://oauth.reddit.com/comments/{ident}.json?raw_json=1&limit=100"
    body, _ = _fetch(endpoint, token, user_agent)
    data = json.loads(body)
    if not isinstance(data, list) or len(data) < 2:
        raise RuntimeError("Reddit did not return a post and comments listing")
    posts = data[0].get("data", {}).get("children", [])
    if not posts or posts[0].get("kind") != "t3":
        raise RuntimeError("Reddit post was not accessible")
    post = posts[0].get("data", {})
    if post.get("removed_by_category") or post.get("selftext") in ("[deleted]", "[removed]"):
        raise RuntimeError("Reddit post was removed/deleted")
    if post.get("id") != ident:
        raise RuntimeError("Reddit post ID mismatch")
    comments_listing = data[1].get("data", {})
    comments = []
    partial = False
    for item in comments_listing.get("children", []):
        if item.get("kind") == "more":
            partial = True
            continue
        if item.get("kind") != "t1":
            continue
        comment = item.get("data", {})
        text = comment.get("body")
        if not isinstance(text, str) or text in ("[removed]", "[deleted]"):
            continue
        comments.append({"id": str(comment.get("id", ""))[:24],
                         "author": str(comment.get("author", ""))[:80],
                         "score": comment.get("score", 0),
                         "text": text[:6000],
                         "created_utc": comment.get("created_utc")})
    media = post.get("secure_media") or post.get("media") or {}
    video = media.get("reddit_video") or {}
    fallback = video.get("fallback_url")
    if fallback:
        p = urlsplit(fallback)
        if p.scheme != "https" or p.hostname != "v.redd.it" or p.port is not None or p.username or p.password:
            fallback = None
    return {
        "id": ident, "title": str(post.get("title", ""))[:600],
        "author": str(post.get("author", ""))[:80],
        "description": str(post.get("selftext", ""))[:24000],
        "subreddit": str(post.get("subreddit", ""))[:120],
        "permalink": str(post.get("permalink", ""))[:300],
        "url": url, "score": post.get("score"),
        "is_video": bool(post.get("is_video")),
        "video_mp4": fallback,
        "comments": comments, "comments_partial": partial or bool(comments_listing.get("after")),
        "comments_count": len(comments),
        "comments_scope": "top-level only, max 100 listing entries; replies may be excluded",
    }


def download_native_video(post: dict, token: str, user_agent: str, out: Path) -> str | None:
    url = post.get("video_mp4")
    if not isinstance(url, str):
        return None
    p = urlsplit(url)
    if p.scheme != "https" or p.hostname != "v.redd.it" or p.port is not None or p.username or p.password:
        raise ValueError("Reddit media must be v.redd.it over HTTPS")
    out.mkdir(parents=True, exist_ok=True)
    raw, _ = _fetch(url, token, user_agent, binary=True)
    if len(raw) < 1000:
        raise RuntimeError("Reddit returned empty native video stream")
    target = out / "reddit-video.mp4"
    target.write_bytes(raw)
    return str(target.resolve())
