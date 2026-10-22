# Social Watch authorization & deployment gate

The MCP HTTP server is a working, tested **OAuth 2.1 resource server**, NOT an identity provider or deployed service. It needs an external issuer and an authenticated HTTPS route before anyone can connect remotely.

## Remote OAuth environment

Example values are placeholders. Obtain real ones from your own OAuth provider (Keycloak, Auth0, Entra, etc.) and provide them through secret storage, never Git:

    SOCIAL_WATCH_OAUTH_ISSUER=https://id.example.com/realms/social
    SOCIAL_WATCH_OAUTH_AUDIENCE=social-watch
    SOCIAL_WATCH_OAUTH_JWKS_URL=https://id.example.com/realms/social/protocol/openid-connect/certs
    SOCIAL_WATCH_PUBLIC_MCP_URL=https://social.example.com/mcp
    SOCIAL_WATCH_ALLOWED_SUBJECTS=<real-user-sub-id>
    SOCIAL_WATCH_BIND=0.0.0.0

The chosen issuer must support Authorization Code + PKCE with ChatGPT-compatible client registration (DCR, CIMD, or registered client). Advertise refresh-token support for persistent connection when available.

The SDK sends HTTP 401 with WWW-Authenticate for unauthenticated MCP requests and exposes /.well-known/oauth-protected-resource/mcp. It verifies signed RS256 JWTs, issuer, audience, allowed subject, social:read scope and expiry. Unknown JWT key IDs do not trigger forced JWKS refresh; the JWKS key set caches for five minutes. Tests generate RSA keys at runtime and verify token rejection.

**Fail-closed binding:** outside 127.0.0.1 the process requires OAuth unless SOCIAL_WATCH_PRIVATE_UNAUTH=1 is explicitly set. That exception must ONLY be used inside an isolated Docker network with a 127.0.0.1-only published host mapping. Do NOT expose it to the internet or create an unauthenticated public tunnel.

### Remaining deployment security prerequisites

- HTTPS ingress with real authenticated OAuth flow and restricted identity principals
- Docker/host egress policy that denies private, loopback, link-local, metadata and internal addresses (also after DNS redirects and rebinding)
- Observed CPU/disk/network caps and per-account rate limits, monitored on real traffic
- Correct permission, terms and privacy handling per social platform
- The user's explicit ChatGPT connection/install step; account/plan/workspace must support custom MCP servers

Docker Compose in this PR still maps 127.0.0.1:8000 only and does not provide an external auth gateway.

## Approved Reddit OAuth adapter

Reddit 2026 rules require an approved app, proper bearer token and an honest unique User-Agent. It doesn't scrape logged-in pages or collect browser cookies.

For a one-hour approved token:

    SOCIAL_WATCH_REDDIT_OAUTH_TOKEN=<approved-access-token>
    SOCIAL_WATCH_REDDIT_USER_AGENT="web:com.example.socialwatch:v0.1 (by /u/yourname)"

For cached automatic refresh (credentials and permissions must already be approved by Reddit):

    SOCIAL_WATCH_REDDIT_CLIENT_ID=<approved-client-id>
    SOCIAL_WATCH_REDDIT_CLIENT_SECRET=<approved-client-secret>
    SOCIAL_WATCH_REDDIT_REFRESH_TOKEN=<consented-refresh-token-with-read-scope>
    SOCIAL_WATCH_REDDIT_USER_AGENT="web:com.example.socialwatch:v0.1 (by /u/yourname)"

Reddit credentials stay in process environment and refreshed access token stays in memory, never in manifests. The reader calls the fixed oauth.reddit.com/comments/<post-id>.json endpoint, collects up to 100 top-level comments with an explicit partial indicator, refuses deleted/removed content, and optionally retrieves native v.redd.it fallback MP4 when present. The fallback MP4 can lack an audio track. No live Reddit token is available in our CI, so the adapter is **unit-tested, not live API verified**.

Reddit developer terms and migration plans may change access; request approval and permissions through official Reddit channels.

## ChatGPT connection limitations

As documented by OpenAI on 2026-10-22, **full custom MCP support is for Business and Enterprise/Edu accounts**; **Pro supports read/fetch custom servers**. No plan entitlement or enabled connection is assumed for this user. Check Plugins > Add custom MCP server in the actual account if eligible. A skills file, GitHub PR, or running Docker service does not automatically register a tool in ChatGPT.

References:
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- https://py.sdk.modelcontextprotocol.io/run/authorization/
- https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki

## Verified / outstanding

- Verified: MCP Streamable HTTP tool discovery, OAuth HTTP 401 and protected-resource metadata, 28+ offline tests, X public MP4-to-contact-sheet e2e, Facebook/TikTok video extraction, Facebook source captions and optional hosted CPU speech.
- Pending: deployment and a connected ChatGPT tool in a permitted plan/workspace; authenticated Reddit live retrieval; blocked Instagram, YouTube and Facebook photo access; all platform comments and privately gated posts.
