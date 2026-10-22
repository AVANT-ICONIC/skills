"""No-network JWT authentication tests using ephemeral test-only RSA keys."""
import asyncio
import os
import sys
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from cryptography.hazmat.primitives.asymmetric import rsa
import jwt

sys.path.insert(0, str(Path(__file__).resolve().parent))
from oauth import AuthConfig, JWTVerifier


class FakeJWKS:
    def __init__(self, public):
        self.key = SimpleNamespace(key_id="testkey", key_type="RSA", key=public)
        self.calls = 0

    def get_signing_keys(self):
        self.calls += 1
        return [self.key]


class OAuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        cls.public_key = cls.private_key.public_key()

    def setUp(self):
        self.cfg = AuthConfig(
            issuer="https://login.example.test/realms/social",
            audience="social-watch",
            jwks_url="https://login.example.test/realms/social/protocol/openid-connect/certs",
            resource_url="https://social.example.test/mcp",
            allowed_subjects=frozenset({"owner-123"}))
        self.key_store = FakeJWKS(self.public_key)
        self.verifier = JWTVerifier(self.cfg, key_client=self.key_store)

    def sign(self, **kwargs):
        data = dict(iss=self.cfg.issuer, aud=self.cfg.audience,
                    sub="owner-123", exp=int(time.time()) + 600,
                    iat=int(time.time()) - 5,
                    scope="social:read", azp="chatgpt")
        data.update(kwargs)
        return jwt.encode(data, self.private_key, algorithm="RS256",
                          headers={"kid": "testkey"})

    def check(self, token):
        return asyncio.run(self.verifier.verify_token(token))

    def test_valid_owner_and_scope(self):
        access = self.check(self.sign())
        self.assertIsNotNone(access)
        self.assertEqual(access.client_id, "chatgpt")
        self.assertEqual(access.subject, "owner-123")
        self.assertEqual(access.resource, self.cfg.resource_url)
        self.assertEqual(access.scopes, ["social:read"])

    def test_wrong_issuer_audience_subject_and_scope(self):
        samples = [
            {"iss": "https://evil.test"},
            {"aud": "other-api"},
            {"sub": "not-owner"},
            {"scope": "social:write"},
            {"exp": int(time.time()) - 3600},
        ]
        for fields in samples:
            with self.subTest(fields=fields):
                self.assertIsNone(self.check(self.sign(**fields)))

    def test_reject_malformed_no_alg_and_oversized(self):
        self.assertIsNone(self.check(""))
        self.assertIsNone(self.check("a" * 10000))
        self.assertIsNone(self.check("abc.def"))
        none_token = jwt.encode({"iss": self.cfg.issuer}, key="", algorithm="none",
                                headers={"kid": "testkey"})
        self.assertIsNone(self.check(none_token))

    def test_unknown_kid_no_forced_fetch(self):
        token = jwt.encode({"iss": self.cfg.issuer}, self.private_key,
                           algorithm="RS256", headers={"kid": "attacker-unknown"})
        for i in range(3):
            self.assertIsNone(self.check(token))
        self.assertEqual(self.key_store.calls, 3)
        # There is one JWKS cache call per verification, but never an
        # attacker-controlled forced refresh / new direct outbound HTTP call.
        self.assertFalse(hasattr(self.key_store, "get_signing_key_from_jwt"))

    def test_oauth_environment_fail_closed(self):
        vars_ = ("SOCIAL_WATCH_OAUTH_ISSUER", "SOCIAL_WATCH_OAUTH_AUDIENCE",
                 "SOCIAL_WATCH_OAUTH_JWKS_URL", "SOCIAL_WATCH_PUBLIC_MCP_URL",
                 "SOCIAL_WATCH_ALLOWED_SUBJECTS")
        with patch.dict(os.environ, {k: "" for k in vars_}):
            self.assertIsNone(AuthConfig.from_environment())
            os.environ["SOCIAL_WATCH_OAUTH_ISSUER"] = self.cfg.issuer
            with self.assertRaises(ValueError):
                AuthConfig.from_environment()
            os.environ["SOCIAL_WATCH_OAUTH_AUDIENCE"] = self.cfg.audience
            os.environ["SOCIAL_WATCH_OAUTH_JWKS_URL"] = self.cfg.jwks_url
            os.environ["SOCIAL_WATCH_PUBLIC_MCP_URL"] = self.cfg.resource_url
            with self.assertRaises(ValueError):
                AuthConfig.from_environment()
            os.environ["SOCIAL_WATCH_ALLOWED_SUBJECTS"] = "owner-123"
            self.assertEqual(AuthConfig.from_environment(), self.cfg)
            os.environ["SOCIAL_WATCH_OAUTH_JWKS_URL"] = "http://127.0.0.1:8080/keys"
            with self.assertRaises(ValueError):
                AuthConfig.from_environment()


if __name__ == "__main__":
    unittest.main()
