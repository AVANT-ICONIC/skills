"""MCP protocol smoke test; no external site/network requests required."""
import asyncio
import os
import subprocess
import sys
import time

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def check() -> None:
    async with streamablehttp_client("http://127.0.0.1:8000/mcp") as (reader, writer, *_):
        async with ClientSession(reader, writer) as session:
            await session.initialize()
            tools = await session.list_tools()
            names = {t.name for t in tools.tools}
            required = {
                "resolve_social_url", "read_social_image", "read_social_contact_sheet",
                "read_social_post_text", "read_social_caption_track",
                "transcribe_social_audio", "social_evidence_status",
                "delete_social_evidence"
            }
            assert required <= names, f"Missing tools: {required - names}"
            bad = await session.call_tool("resolve_social_url", {"url": "http://127.0.0.1/private"})
            assert bad.isError, "Unsafe URL should be rejected"
            print("MCP_PROTOCOL_OK", sorted(required))


def main() -> None:
    env = {**os.environ, "SOCIAL_WATCH_BIND": "127.0.0.1", "SOCIAL_WATCH_PORT": "8000"}
    process = subprocess.Popen([sys.executable, "social-watch/bridge/server.py"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
                               env=env)
    try:
        for _ in range(50):
            if process.poll() is not None:
                raise RuntimeError("MCP server exited unexpectedly")
            try:
                import socket
                with socket.create_connection(("127.0.0.1", 8000), timeout=0.25):
                    break
            except OSError:
                time.sleep(0.1)
        else:
            raise RuntimeError("MCP server did not bind to localhost")
        asyncio.run(check())
    finally:
        process.terminate()
        try:
            process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate(timeout=3)


if __name__ == "__main__":
    main()
