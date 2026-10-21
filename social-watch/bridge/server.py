"""ChatGPT-readable MCP facade for the existing Social Watch tools.

Default transport listens on localhost only. DO NOT publish without a real
authentication proxy / MCP OAuth configuration and network egress controls.
"""
from __future__ import annotations

import json
import os

from mcp.server.fastmcp import FastMCP, Image
from mcp.types import CallToolResult, TextContent

from core import SocialWatchBridge

mcp = FastMCP("AVANT Social Watch", stateless_http=True, json_response=True,
              host=os.environ.get("SOCIAL_WATCH_BIND", "127.0.0.1"),
              port=int(os.environ.get("SOCIAL_WATCH_PORT", "8000")))
bridge = SocialWatchBridge()


@mcp.tool()
def resolve_social_url(url: str, max_frames: int = 48) -> dict:
    """Fetch one public X/Instagram/Facebook/TikTok/YouTube/Reddit post URL, prepare
    evidence and contact sheets if authorized media is downloadable. Returns job_id.
    Never reports prepared frames as already watched. May return unavailable.
    """
    return bridge.resolve(url, max_frames=max_frames)


@mcp.tool()
def read_social_contact_sheet(job_id: str, index: int = 0) -> CallToolResult:
    """Return an ACTUAL source-derived timestamped JPEG contact sheet to inspect
    visually. Call after resolve_social_url with contact_sheets>0.
    """
    data = bridge.sheet(job_id, index=index)
    return CallToolResult(content=[
        TextContent(type="text", text=json.dumps({
            "job_id": job_id, "index": index, "kind": "real_source_contact_sheet",
            "instruction": "Inspect these pixels; this image is source evidence, not a full-motion video."})),
        Image(data=data, format="jpeg").to_image_content()
    ])


@mcp.tool()
def read_social_image(job_id: str, index: int = 0) -> CallToolResult:
    """Return actual downloaded photo/carousel image as JPEG pixels.
    These are source pixels, not generated images or guessed thumbnails.
    """
    data = bridge.image(job_id, index=index)
    return CallToolResult(content=[
        TextContent(type="text", text=json.dumps({
            "job_id": job_id, "index": index, "kind": "actual_source_image"})),
        Image(data=data, format="jpeg").to_image_content()
    ])


@mcp.tool()
def read_social_post_text(job_id: str) -> dict:
    """Return actual fetched post description and available structured text.
    Does NOT claim comments or entire threads unless evidence exists.
    """
    return bridge.post_text(job_id)


@mcp.tool()
def read_social_caption_track(job_id: str) -> str:
    """Read the actual timestamped source caption track; may be absent.
    This is NOT automatically verified audio transcription.
    """
    return bridge.captions(job_id)


@mcp.tool()
def transcribe_social_audio(job_id: str) -> str:
    """Optional CPU transcription of already-acquired video audio.
    Requires SOCIAL_WATCH_ENABLE_STT=1 and faster-whisper on the server.
    """
    return bridge.speech(job_id)


@mcp.tool()
def social_evidence_status(job_id: str) -> dict:
    """Get grounded extraction state, authentic source URL and explicit limitations."""
    return bridge.summary(job_id)


@mcp.tool()
def delete_social_evidence(job_id: str) -> bool:
    """Immediately discard cached media, frame/contact sheets, and transcripts."""
    return bridge.delete(job_id)


if __name__ == "__main__":
    # Host/port defaults for v1 FastMCP are local-only. Use reverse proxy and
    # authenticated HTTPS endpoint for real WebUI use; no unauthenticated exposure.
    mcp.run(transport="streamable-http")
