---
name: social-watch
description: Read or inspect a public social-media post, thread, carousel, Reel, Short, or video from a URL on YouTube, Instagram, Facebook, TikTok, X, or Reddit. Use when the user supplies a social URL and wants its words, visuals, audio, comments, context, or editing analyzed. Route moving-image inspection through video-watch. A transcript alone is not watching.
compatibility: Portable Agent Skill; needs actual URL-reading tools for live data. Optional Python 3 helper uses installed yt-dlp or gallery-dl in a networked runtime. No extra vision LLM or paid API is required, but restricted platform URLs may remain inaccessible.
---

# Social Watch (URL-first)

**Contract:** the user provides a URL, never has to extract an MP4 in DevTools. Retrieve only available and authorized content, and never conflate metadata, thumbnails or a queued watch job with observed visuals.

## Scope and composition

- Activate for individual social posts, Reddit posts/comment discussions, X threads, image carousels, Reels, TikToks, and YouTube videos/Shorts, whether the request is to read, listen, watch, summarize, examine or reverse-engineer them.
- Don't activate for publishing, scheduling, generic account analytics, mass account scraping or bulk audience exports.
- Use the separately installed **video-watch** skill for visual evidence, timecode contact sheets, native captions, editor-mode pacing and actual frame inspection. Never duplicate its video processing code in this skill.
- Agents with built-in vision can inspect sampled images. Optional STT backends (native audio, Cactus Whistle, Whisper) must be **actually available**, not presumed installed.

## Bounded fallback ladder

1. **Inventory current evidence first:** provided post text, screenshots, attachments, transcripts, existing manifests, cached frames. Avoid reacquisition when the user's question can already be answered.
2. **Discover native read-only connectors and browser tools:** prefer sources returning the **exact content URL** and (for video) completed scene evidence. Confirm scope, access and ID. Do not spend separately metered provider credits without approval. A submitted or pending job is not evidence.
3. **Read the public web page** if it is accessible. Retrieve post body, caption, image references and source metadata; captions do not prove video motion. For comments, report whether the thread is complete or sampled.
4. **Use a real networked execution runtime** when available: run the optional stdlib Python helper with the URL. It invokes installed yt-dlp and/or gallery-dl, with bounded attempts and unauthenticated defaults. Inspect its manifest and local files. If native commands are absent, network/DNS is blocked or authentication is required, report the actual failure instead of inventing a successful download. No access-control evasion.
5. **Inspect acquired evidence:** text with actual article/post reader, images with an image-view tool, videos with video-watch's frame inspection, speech from actual captions or a permitted audio/transcription tool. Distinguish claims, quotations, visuals and inference.
6. **Fail honestly:** no retry storms, no request for manual MP4 extraction, no presenting a thumbnail, text snippet, transcript or media path as fully watched content.

## Platform routes

| Platform | Prefer | CLI fallback | Limitation |
| --- | --- | --- | --- |
| YouTube | Native transcript + video reader | yt-dlp then video-watch | Long video frame sampling and comments need separate coverage |
| Instagram | Public caption + connected Reel watcher | yt-dlp for Reels, gallery-dl for post carousels | Session blocks, comments not guaranteed |
| TikTok | Connected short-form watcher, caption | yt-dlp and gallery-dl when supported | Short links, geo/session challenges |
| Facebook | Public video or post page, linked media | yt-dlp for video, gallery-dl fallback | Session blocks; image-only posts need gallery/readable page |
| X | Readable full tweet/thread or authorized connector | yt-dlp video / gallery-dl images | Thread/quote context frequently unavailable |
| Reddit | Authorized Reddit API / readable post and comment thread | yt-dlp hosted video / gallery-dl images | OAuth, rate limits, removals and comment pagination |

The CLI helper **does not** retrieve complete X/Reddit text threads or comments. They require an actual page reader or compliant API connection. Text-only posts are not marked as read without body content. Reddit's public Data API is moving toward its Developer Platform; never depend on anonymous scraping or a transient .json path as a permanent contract. Follow platform terms, access controls and deletion/retention requirements.

## Optional acquisition helper

The bundled script is intentionally small and **not** a second video-watch implementation:

```bash
python3 social-watch/scripts/social_ingest.py 'https://www.youtube.com/watch?v=VIDEO_ID'
python3 social-watch/scripts/social_ingest.py 'https://www.instagram.com/reel/SHORTCODE/' --download
python3 social-watch/scripts/social_ingest.py 'https://www.reddit.com/r/sub/comments/POST_ID/' --identify-only
python3 -m unittest discover -s social-watch/scripts -p 'test_*.py' -v
```

For speech without captions on an actually downloaded video, an **optional** CPU command is provided:

```bash
pip install faster-whisper
python3 social-watch/scripts/audio_transcribe.py /path/to/media.mp4 --model base --out-dir /tmp/social-speech
```

That command can run on a networked hosted runner or VPS; its first run downloads model weights. It is not silently executable in ChatGPT WebUI, and automatic speech transcription cannot be claimed without the generated transcript being inspected. A platform-provided VTT/SRT caption track is separately normalized to `caption-transcript.txt` and labeled as captions, **not** verified audio transcription.

Python 3 is sufficient to identify and normalize URLs. Media extraction requires a network-enabled runtime with yt-dlp and/or gallery-dl. Video-watch additionally uses ffmpeg, ffprobe and Pillow unless native video viewers are available. No local AI model or commercial API is required. By default, no cookies are exported/read and no browser session is touched. Work in private temporary directories, bounded to individual posts, with limited files/download time. Treat URL/media/text as untrusted input. Never silently send private content to an external service.

The script writes `manifest.json`: platform, URL, selected safe metadata, retrieved description if present, local media/caption paths, attempts, warnings and explicit evidence state. It **never** claims to transcribe audio, inspect images, or watch media.

## ChatGPT WebUI reality

A `SKILL.md` is **instructions, not an installed software connector**. It cannot grant ChatGPT Internet access, shell binaries, video playback, a separate speech model, credentials or new tools. If WebUI has a connected short-form watcher, use it with the provider's disclosed credit cost. If WebUI has a working networked shell, the helper can acquire files. If shell DNS/network is blocked, a separately deployed **remote MCP/HTTP ingestion service** is needed for reliable URL-in access. This skill is independent of that service; merely importing it does **not** deploy the backend.

A remote tool should expose `resolve_social_url(url)` and return bounded structured text evidence plus inspected-asset references, frames/contact sheets and captions where permitted. Enforce exact domain allowlisting, safe DNS resolution on *every redirect*, SSRF protection, egress and size/time limits, rate limits, credential isolation, retention/deletion, and per-platform authorization. Don't expose session cookies or signed media URLs in logs. As an alternative, use an existing connected provider's completed watch results.

## Evidence state

- **POST TEXT:** actual body/caption acquired; not inferred from a cover.
- **COMMENTS:** exact fetched messages, with scope and ordering noted.
- **IMAGES:** real images were inspected.
- **VISUAL + TRANSCRIPT:** source frames actually inspected and speech/caption evidence read.
- **VISUAL ONLY / TRANSCRIPT ONLY / METADATA ONLY / UNAVAILABLE:** use the proof standards of video-watch, including honest sampling gaps.
- **MEDIA ACQUIRED (UNINSPECTED):** downloaded file exists but no visual/audio observation has happened.

Provide the source URL and a substantive answer with timestamps/thread references where supported. Auto-caption names/numbers may be wrong; spoken claims are not independent facts. No claim of full motion coverage from sparse sampling.

## Verification boundary

The bundled offline tests verify URL identification, allowlisting, caption normalization, invocation and missing-tool handling; they **do not prove live extraction** on social platforms. Acceptance requires one currently accessible real URL per platform (six total), checked output files/body contents, actual visual inspection for video, and an inaccessible/private case. Do not call the entire multi-platform pipeline working before those pass.
