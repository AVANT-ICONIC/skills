"""OAuth 2.1 JWT resource-server verification for the MCP transport.

An external issuer (e.g. Keycloak/Auth0) handles sign-in, consent, and tokens.
No secrets, API keys or signed media URLs are accepted from clients.

Avoid PyJWKClient.get_signing_key_from_jwt: pre-verification payload parsing and
unknown-kid refreshes have historically caused denial-of-service issues.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlsplit

import jwt
from mcp.server.auth.provider import AccessToken
from mcp.server.auth.settings import AuthSettings
from pydantic import AnyHttpUrl


@dataclass(frozen=True)
class AuthConfig:
    issuer: str
    audience: str
    jwks_url: str
    resource_url: str
    allowed_subjects: frozenset[str]
    scopes: tuple[str, ...] = ("social:read",)

    @classmethod
    def from_environment(cls) -> AuthConfig | None:
        keys = ("SOCIAL_WATCH_OAUTH_ISSUER", "SOCIAL_WATCH_OAUTH_AUDIENCE",
                "SOCIAL_WATCH_OAUTH_JWKS_URL", "SOCIAL_WATCH_PUBLIC_MCP_URL")
        fields = [os.environ.get(key, "").strip() for key in keys]
        if not any(fields):
            return None
        if not all(fields):
            raise ValueError("OAuth requires issuer, audience, JWKS URL and public MCP URL")
        issuer, audience, jwks_url, resource_url = fields
        for target in (issuer, jwks_url, resource_url):
            url = urlsplit(target)
            if url.scheme != "https" or not url.hostname or url.username or url.password or url.fragment:
                raise ValueError("OAuth issuer, JWKS and resource endpoint must be HTTPS URLs")
        if not resource_url.endswith("/mcp"):
            raise ValueError("OAuth public resource endpoint must end with /mcp")
        subs = frozenset(item.strip() for item in
                          os.environ.get("SOCIAL_WATCH_ALLOWED_SUBJECTS", "").split(",") if item.strip())
        if not subs:
            raise ValueError("OAuth requires explicit SOCIAL_WATCH_ALLOWED_SUBJECTS allowlist")
        return cls(issuer.rstrip("/"), audience, jwks_url, resource_url,
                   subs)

    def auth_settings(self) -> AuthSettings:
        return AuthSettings(issuer_url=AnyHttpUrl(self.issuer),
                            resource_server_url=AnyHttpUrl(self.resource_url),
                            required_scopes=list(self.scopes),
                            validate_token_resource=True)


class JWTVerifier:
    """JWT signature, audience, issuer, expiry, scope and user subject validator."""

    def __init__(self, config: AuthConfig, key_client=None) -> None:
        self.config = config
        # PyJWKClient refreshes JWKS on its TTL, but we never force a refresh
        # on an unknown attacker-controlled kid. Size limits defend decoding.
        self.client = key_client or jwt.PyJWKClient(config.jwks_url,
                                                    cache_jwk_set=True, lifespan=300,
                                                    cache_keys=False, timeout=4,
                                                    cooldown_duration=120)

    async def verify_token(self, token: str) -> AccessToken | None:
        if not token or len(token) > 8192 or token.count(".") != 2:
            return None
        try:
            header = jwt.get_unverified_header(token)
            if not isinstance(header, dict) or header.get("alg") != "RS256":
                return None
            kid = header.get("kid")
            if not isinstance(kid, str) or not 1 <= len(kid) <= 128:
                return None
            # get_signing_keys() uses the JWKS TTL; no forced network fetch for
            # an unrecognized key id. Cache rotation naturally occurs at TTL.
            key = next((j.key for j in self.client.get_signing_keys()
                        if j.key_id == kid and j.key_type == "RSA"), None)
            if key is None:
                return None
            claims = jwt.decode(token, key, algorithms=["RS256"],
                                issuer=self.config.issuer,
                                audience=self.config.audience,
                                options={"require": ["exp", "iat", "sub", "iss", "aud"],
                                         "verify_exp": True, "verify_nbf": True},
                                leeway=15)
            subject = claims.get("sub")
            if not isinstance(subject, str) or subject not in self.config.allowed_subjects:
                return None
            scope_str = claims.get("scope", "")
            scope = scope_str.split() if isinstance(scope_str, str) else []
            if not set(self.config.scopes).issubset(scope):
                return None
            client_id = claims.get("client_id") or claims.get("azp") or "unknown"
            if not isinstance(client_id, str):
                return None
            return AccessToken(token=token, client_id=client_id, scopes=scope,
                               subject=subject, resource=self.config.resource_url,
                               expires_at=int(claims["exp"]),
                               claims={"iss": self.config.issuer})
        except (jwt.PyJWTError, jwt.PyJWKClientError, ValueError, TypeError,
                KeyError, OSError, RecursionError):
            return None
