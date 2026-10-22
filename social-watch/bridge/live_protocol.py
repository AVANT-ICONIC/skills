"""Actual Streamable HTTP e2e: public X URL -> real ImageContent in an MCP client.

Runs only in explicitly networked CI. Uses no account cookies, paid API or
separate vision model. Verifies image bytes delivered over MCP, not just files.
"""
from __future__ import annotations
import asyncio
import base64
import json
import os
import socket
import subprocess
import sys
import time
from io import BytesIO
from pathlib import Path

from PIL import Image
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

SOURCE = "https://x.com/SpaceX/status/2049581577844199476/video/1"


def parse_tool_result(data) -> dict:
    if data.isError:
        raise AssertionError("MCP tool returned an error")
    if data.structuredContent:
        obj = data.structuredContent
        if isinstance(obj, dict) and "job_id" in obj:
            return obj
        if isinstance(obj, dict) and isinstance(obj.get("result"), dict):
            return obj["result"]
    for item in data.content:
        if item.type == "text":
            obj = json.loads(item.text)
            if isinstance(obj, dict) and "job_id" in obj:
                return obj
    raise AssertionError("MCP resolve returned no session id")


async def check():
    async with streamablehttp_client("http://127.0.0.1:8000/mcp") as (reader, writer, *_):
        async with ClientSession(reader, writer) as cli:
            await cli.initialize()
            reply = await cli.call_tool("resolve_social_url",
                                        {"url": SOURCE, "max_frames": 12})
            evidence = parse_tool_result(reply)
            job = evidence["job_id"]
            print("MCP_LIVE_EVIDENCE", json.dumps({
                "platform":evidence["platform"],
                "state":evidence["state"],
                "contact_sheets":evidence["contact_sheets"]}))
            try:
                assert evidence["state"] == "frames_prepared_uninspected"
                assert evidence["contact_sheets"] >= 1
                response = await cli.call_tool("read_social_contact_sheet",
                                               {"job_id":job, "index":0})
                assert not response.isError
                images = [item for item in response.content if item.type == "image"]
                assert images, "MCP tool returned no actual image content"
                raw = base64.b64decode(images[0].data, validate=True)
                with Image.open(BytesIO(raw)) as img:
                    assert img.format == "JPEG"
                    assert img.width >= 640 and img.height >= 400
                    print("MCP_LIVE_IMAGE_BYTES_PASS", len(raw), img.size)
            finally:
                try:
                    await cli.call_tool("delete_social_evidence", {"job_id":job})
                except Exception:
                    pass


def main():
    env = {**os.environ, "SOCIAL_WATCH_BIND":"127.0.0.1",
           "SOCIAL_WATCH_PORT":"8000",
           "SOCIAL_WATCH_OAUTH_ISSUER":"",
           "SOCIAL_WATCH_OAUTH_JWKS_URL":"",
           "SOCIAL_WATCH_OAUTH_AUDIENCE":"",
           "SOCIAL_WATCH_PUBLIC_MCP_URL":""}
    proc = subprocess.Popen([sys.executable,"social-watch/bridge/server.py"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, env=env)
    try:
        for _ in range(80):
            if proc.poll() is not None:
                raise RuntimeError("MCP live test server failed to start")
            try:
                with socket.create_connection(("127.0.0.1",8000),timeout=.2):
                    break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError("MCP live server never bound")
        asyncio.run(check())
    finally:
        proc.terminate()
        try:
            proc.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.communicate(timeout=3)


if __name__ == "__main__":
    main()
