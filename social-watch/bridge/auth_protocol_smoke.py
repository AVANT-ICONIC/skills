"""Verify the real MCP HTTP stack fails closed when OAuth is enabled."""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

def main() -> None:
    env = {**os.environ,
           "SOCIAL_WATCH_BIND": "127.0.0.1",
           "SOCIAL_WATCH_PORT": "8000",
           "SOCIAL_WATCH_OAUTH_ISSUER": "https://login.example.test/realms/social",
           "SOCIAL_WATCH_OAUTH_AUDIENCE": "social-watch",
           "SOCIAL_WATCH_OAUTH_JWKS_URL": "https://login.example.test/keys",
           "SOCIAL_WATCH_PUBLIC_MCP_URL": "https://social.example.test/mcp",
           "SOCIAL_WATCH_ALLOWED_SUBJECTS": "owner-123"}
    process = subprocess.Popen([sys.executable, "social-watch/bridge/server.py"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, env=env)
    try:
        for _ in range(80):
            if process.poll() is not None:
                stderr = process.stderr.read().decode("utf-8", errors="replace")[:1500]
                raise RuntimeError("Auth server failed: " + stderr)
            try:
                with socket.create_connection(("127.0.0.1", 8000), timeout=.2):
                    break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError("OAuth MCP did not bind")
        req = Request("http://127.0.0.1:8000/mcp",
                      data=json.dumps({"jsonrpc":"2.0","id":1,
                                       "method":"initialize","params":{}}).encode(),
                      headers={"Content-Type":"application/json","Accept":"application/json, text/event-stream"},
                      method="POST")
        try:
            with urlopen(req,timeout=6) as resp:
                raise AssertionError("Unauthenticated MCP unexpectedly returned " + str(resp.status))
        except HTTPError as exc:
            assert exc.code == 401, f"Expected HTTP 401, got {exc.code}"
            assert "WWW-Authenticate" in exc.headers, "OAuth discovery challenge missing"
        metadata = "http://127.0.0.1:8000/.well-known/oauth-protected-resource/mcp"
        with urlopen(metadata,timeout=5) as resp:
            assert resp.status == 200
            body = json.load(resp)
        assert body["resource"] == env["SOCIAL_WATCH_PUBLIC_MCP_URL"], body
        assert env["SOCIAL_WATCH_OAUTH_ISSUER"] in body["authorization_servers"], body
        print("MCP_OAUTH_HTTP_401_AND_DISCOVERY_OK")
    finally:
        process.terminate()
        try:
            process.communicate(timeout=4)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate(timeout=3)

if __name__ == "__main__":
    main()
