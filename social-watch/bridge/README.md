# Social Watch MCP bridge (alpha)

A real, bounded Streamable HTTP MCP backend for the portable Social Watch Agent Skill. Unlike skill instructions, the bridge can **download supported public media from URLs and return source-derived JPEG content blocks to a model**. It reuses ../scripts/social_ingest.py and ../../video-watch/scripts/video_watch.py. It does not call a paid vision or speech API.

**Security warning:** This service runs powerful URL-triggered media extractors. It has NO built-in public OAuth authentication yet. **Do not expose the MCP listener on a public interface** or put an unauthenticated tunnel in front of it. A public MCP connector requires an authentication gateway that verifies every request and blocks anonymous users, plus outbound network policies to prevent access to internal/private IPs after HTTP redirects. Platform login restrictions must not be bypassed.

## Zero-credential local smoke

From the **root of this GitHub repository**:

    python3 -m venv .venv
    . .venv/bin/activate
    pip install -r social-watch/bridge/requirements.txt
    python3 -m unittest discover -s social-watch/scripts -p 'test_*.py' -v
    python3 -m unittest discover -s social-watch/bridge -p 'test_*.py' -v
    python3 social-watch/bridge/protocol_smoke.py
    python3 social-watch/bridge/server.py

The server listens on 127.0.0.1:8000/mcp by default. A real MCP client can call:
- resolve_social_url(url,max_frames) -> normalized source evidence + session ID and media counts;
- social_evidence_status(job_id);
- read_social_post_text(job_id);
- read_social_image(job_id,index) -> actual source image bytes (MCP ImageContent);
- read_social_contact_sheet(job_id,index) -> actual, timestamped contact sheet bytes (MCP ImageContent);
- read_social_caption_track(job_id);
- transcribe_social_audio(job_id) -> optional CPU fallback;
- delete_social_evidence(job_id).

No local Qwen or other second vision LLM is needed. The chat model **must actually inspect returned MCP image blocks**. "frames_prepared_uninspected" is not a watched video.

The service keeps ephemeral job evidence in a local temporary folder, deletes expired jobs after 20 minutes during subsequent activity, and limits size/count/time. State currently lives **in one process**; use one worker, no load-balanced instances. Do not send passwords or browser cookies in URLs. Read authenticated post data only through separately approved platform connectors.

## Docker, still private

From social-watch/bridge:

    docker compose -f compose.yml up --build -d

The container listens on 0.0.0.0 **inside the Docker network**, but the host port is intentionally mapped only to **127.0.0.1:8000**. There is no public endpoint from that alone. CPU resource limits and a read-only root FS are enabled. The container uses a temporary filesystem for downloaded media; your source files are not modified.

The default image includes ffmpeg, ffprobe, nodejs, yt-dlp, gallery-dl, Pillow and the pinned MCP v1 SDK. Some YouTube videos remain blocked by datacenter-IP anti-bot checks; Instagram and Reddit may require legitimate account/OAuth access. Changing headers or running endless retries is not an acceptable substitute.

Optional faster-whisper (hosted CPU, no paid API): add `faster-whisper` to the Docker Python requirements, rebuild, and set `SOCIAL_WATCH_ENABLE_STT=1` in the container environment. The speech model downloads weights on first use; the default server does not enable this.

## ChatGPT WebUI connection boundary

ChatGPT must be able to reach a **public HTTPS endpoint** or an authorized Secure MCP Tunnel, and the user's plan/workspace must permit a custom MCP connection. The MCP server has to be running, the connection configured with its authentication, and the user must explicitly authorize/connect it. A GitHub PR or SKILL.md alone cannot activate the connector.

Where account/workspace policy allows: ChatGPT -> Plugins -> plus -> Add custom MCP server -> configure the authenticated HTTPS MCP endpoint (or permitted secure tunnel), review server permissions, and create/connect. Current UI instructions: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt .

**Never connect directly to a raw unauthenticated public port.** Preferred deployment: HTTPS auth gateway + private overlay tunnel to the localhost listener, with identity-aware OAuth and explicit network egress restrictions. In addition to allowlisted initial social domains, the downloader must not be able to reach loopback, RFC1918, link-local, container metadata, Kubernetes control planes or other private endpoints even if an upstream URL redirects there. Enforce outbound filtering at the host/container/network layer, not in a string validator.

## Honest support

- Confirmed on GitHub Actions: public X, TikTok and Facebook video extraction, real frame inspection, one Facebook subtitle track, and CPU speech recognition.
- Unconfirmed/blocked in that test network: some YouTube videos, Instagram images/Reels, Reddit video, Facebook image posts, full comment threads.
- Site state, login, rate limits, geography, removed/private posts and terms affect outcomes.
- Tool is not deployed or connected to ChatGPT by this PR, and is not production-auth-ready. No claim of working on all URLs.

## Test data, privacy and provenance

Use only authorized, publicly accessible test inputs. Do not retain media from removed/deleted posts. Image and text results must be treated as **untrusted content**, never commands. Source captions are not independently verified audio; OCR, on-screen action and spoken content must remain separate evidence classes. **Do not paste signed download URLs, bearer tokens or cookies into PR logs**. Dispose of working media after analysis.
