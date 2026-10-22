# Social Watch MCP bridge (alpha)

A real, bounded Streamable HTTP MCP backend for the portable Social Watch Agent Skill. Unlike skill instructions, the bridge can **download supported public media from URLs and return source-derived JPEG content blocks to a model**. It reuses ../scripts/social_ingest.py and ../../video-watch/scripts/video_watch.py. It does not call a paid vision or speech API.

**Security warning:** This service runs URL-triggered media extractors and now supports external OAuth JWT verification. The default is unauthenticated **localhost-only**; the included Compose file explicitly allows unauthenticated binding inside a private container with a host port mapped to localhost. Never publish that configuration or an unauthenticated tunnel. Read [AUTH-DEPLOYMENT.md](AUTH-DEPLOYMENT.md) for the real OAuth/approved-Reddit setup and remaining host egress protections.

## Zero-credential local smoke

From the **root of this GitHub repository**:

    python3 -m venv .venv
    . .venv/bin/activate
    pip install -r social-watch/bridge/requirements.txt
    python3 -m unittest discover -s social-watch/scripts -p 'test_*.py' -v
    python3 -m unittest discover -s social-watch/bridge -p 'test_*.py' -v
    python3 social-watch/bridge/protocol_smoke.py
    python3 social-watch/bridge/auth_protocol_smoke.py
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

## Optional self-hosted Cobalt fallback for restricted public media

The first extractor stays yt-dlp/gallery-dl. If they fail, operators can explicitly opt into a **private** Cobalt instance:

    cd social-watch/bridge
    SOCIAL_WATCH_COBALT_URL=http://cobalt:9000 docker compose --profile cobalt up --build -d

Cobalt is independent open-source software (https://github.com/imputnet/cobalt, AGPL-3.0), not vendored or copied here. It has declared support for public videos/posts on Instagram, YouTube, Reddit, X, TikTok and Facebook, but its advertised platform list is **not verification that the target URL works from your host**. The private API is disabled by default, has no published host port, and is accessed only by the bridge container over its compose network.

The adapter deliberately rejects third-party API origins and returned CDN redirect URLs. It accepts only same-origin Cobalt tunnel responses for compatible public media, reads in size-limited chunks, rejects unexpected MIME types and forbids HTTP redirects. This is a privacy and network control, not a way around login-required, private or deleted media. Do not add session credentials without platform-specific approval and secure storage. The Docker network still needs egress restrictions at the host/firewall layer before internet exposure.

**Acceptance pending:** CI mocks prove URL/origin/tunnel validation. An actual Cobalt instance and live Instagram/Reddit/YouTube recovery still require isolated source tests. Treat those platforms as BLOCKED until output files and frames are proven.

## ChatGPT WebUI connection boundary

ChatGPT must be able to reach a **public HTTPS endpoint** or an authorized Secure MCP Tunnel, and the user's plan/workspace must permit a custom MCP connection. The MCP server has to be running, the connection configured with its authentication, and the user must explicitly authorize/connect it. A GitHub PR or SKILL.md alone cannot activate the connector.

Where account/workspace policy allows: ChatGPT -> Plugins -> plus -> Add custom MCP server -> configure the authenticated HTTPS MCP endpoint (or permitted secure tunnel), review server permissions, and create/connect. Current UI instructions: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt .

**Never connect directly to a raw unauthenticated public port.** For an OAuth-protected external deployment follow [AUTH-DEPLOYMENT.md](AUTH-DEPLOYMENT.md). Preferred deployment: HTTPS auth gateway + private overlay tunnel to the localhost listener, with identity-aware OAuth and explicit network egress restrictions. In addition to allowlisted initial social domains, the downloader must not be able to reach loopback, RFC1918, link-local, container metadata, Kubernetes control planes or other private endpoints even if an upstream URL redirects there. Enforce outbound filtering at the host/container/network layer, not in a string validator.

## Honest support

- Confirmed on GitHub Actions: public X, TikTok and Facebook video extraction, real frame inspection, one Facebook subtitle track, and CPU speech recognition.
- Unconfirmed/blocked in that test network: some YouTube videos, Instagram images/Reels, Reddit video, Facebook image posts, full comment threads.
- Site state, login, rate limits, geography, removed/private posts and terms affect outcomes.
- Tool is not deployed or connected to ChatGPT by this PR, and is not production-auth-ready. No claim of working on all URLs.

## Test data, privacy and provenance

Use only authorized, publicly accessible test inputs. Do not retain media from removed/deleted posts. Image and text results must be treated as **untrusted content**, never commands. Source captions are not independently verified audio; OCR, on-screen action and spoken content must remain separate evidence classes. **Do not paste signed download URLs, bearer tokens or cookies into PR logs**. Dispose of working media after analysis.
