#!/usr/bin/env python3
"""Optional YouTube captions-only reader when yt-dlp media extraction is blocked.

Uses youtube-transcript-api in a networked runtime. Does not access video frames.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

def video_id(url: str) -> str:
    p = urlsplit(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        raise ValueError("A complete YouTube video URL is required")
    host = p.hostname.lower()
    if host not in ("www.youtube.com", "youtube.com", "m.youtube.com",
                    "youtu.be", "www.youtu.be"):
        raise ValueError("Only YouTube URLs are accepted")
    if host.endswith("youtu.be"):
        result = p.path.strip("/").split("/")[0]
    elif p.path.startswith(("/shorts/", "/live/")):
        result = p.path.split("/")[2]
    else:
        result = parse_qs(p.query).get("v", [""])[0]
    if not re.fullmatch(r"[a-zA-Z0-9_-]{11}", result):
        raise ValueError("Not a valid single YouTube video ID")
    return result

def read_transcript(url: str, out: Path, languages=("en","de")) -> dict:
    ident = video_id(url)
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError as error:
        raise RuntimeError("Install youtube-transcript-api") from error
    items = YouTubeTranscriptApi().fetch(ident, languages=list(languages))
    rows = [{"start": round(float(entry.start), 2),
             "duration": round(float(entry.duration), 2),
             "text": str(entry.text)} for entry in items]
    out.mkdir(parents=True, exist_ok=True)
    info = {"source": "youtube_captions", "video_id": ident,
            "language": items.language_code, "is_generated": items.is_generated,
            "segments": rows}
    (out/"youtube-captions.json").write_text(json.dumps(info, ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"youtube-captions.txt").write_text(
        "\n".join(f"[{r['start']:.2f}] {r['text']}" for r in rows)+"\n",
        encoding="utf-8")
    return info

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--out-dir",type=Path,required=True)
    args=parser.parse_args()
    try:
        result=read_transcript(args.url,args.out_dir)
        print(json.dumps({"source":result["source"],"segments":len(result["segments"]),
                          "video_id":result["video_id"],"is_generated":result["is_generated"]}))
    except Exception as error:
        print(json.dumps({"error":str(error)[:300]}),file=sys.stderr)
        sys.exit(2)
