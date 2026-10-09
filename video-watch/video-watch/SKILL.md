---
name: video-watch
description: Inspect videos from URLs or accessible local files using real timestamped frames and available audio or captions. Use for watching, summarizing, reviewing, reverse-engineering, or answering questions about visual events in a video. A transcript alone is not a watch.
compatibility: Uses available video, image and transcript tools. Optional local extraction can use ffmpeg/ffprobe; no particular agent vendor, paid API or fixed workspace path is required.
---

# Video Watch

Actually inspect the video. Keep observed visuals, spoken or captioned content, and inference distinct.

## Resolve the source

Use the exact attachment path or verified URL. Prefer available native video inspection. If downloading is needed, use supported tools and an authorized source; do not invent paths, bypass access controls or require a paid dependency. For local extraction, probe available ffmpeg/ffprobe first. URL acquisition may use an available yt-dlp installation.

## Sample with purpose

Establish duration and the user's question. Combine uniform coverage with scene-change frames when available. Inspect the opening more densely when the hook matters. Contact sheets can reduce image reads, but every relevant sheet must actually be inspected. Preserve timestamps and source identity in the manifest.

A whole-video overview is not proof of every event. Use transcript timestamps and the question to select focused ranges. Zoom individual frames for small text, code, charts, UI or ambiguous details. Use sequential frames or playback before claiming motion or an event between samples.

## Audio and captions

Read available captions or transcribe through supported tools. Mark automatic-caption uncertainty. Missing audio does not block visual-only inspection; missing visuals means the answer is transcript-only, not a watch. If a long file fails, try bounded shorter chunks and combine evidence with original-time offsets. Do not repeat a site block or challenge without a new permitted route.

## Inspect and answer

1. Read media metadata and any extraction manifest.
2. Open actual frames or contact sheets, not merely file names or OCR.
3. Read available transcript evidence.
4. Inspect focused ranges and original-resolution frames where needed.
5. Tie important claims to timestamps and label inference.

Never treat generated images as inspected evidence, search excerpts as a transcript, or captions as proof of visible action. Report concrete failed steps and coverage gaps without claiming the whole video was watched.

## Reuse and privacy

Reuse existing source media and frames when the exact source and required resolution match. Rerun only relevant ranges when the question changes. Keep private recordings, transcripts and screenshots private. A request to analyze a video does not authorize uploading it elsewhere, publishing extracted assets or sending them to another person.

## Done

The requested source is resolved, relevant actual frames are inspected, available audio or captions are considered, detail checks are complete, and the answer separates observation from inference with timestamps and honest sampling limits.

## Optional extraction helper

The bundled [scripts/video_watch.py](scripts/video_watch.py) requires Python 3, ffmpeg/ffprobe and Pillow. URL sources additionally need yt-dlp. Inspect available tools and use permitted environment-local installation where needed; no fixed runtime or remote helper fetch is required. The Markdown workflow also works with equivalent native tools.

```bash
python3 video-watch/scripts/video_watch.py /path/to/video.mp4 --max-frames 72
python3 video-watch/scripts/video_watch.py /path/to/video.mp4 --start 02:15 --end 02:45 --out-dir /path/to/new-run
```

Time arguments accept seconds, MM:SS or HH:MM:SS. The frame count is a configurable sampling budget, not an agent turn limit. The helper samples scene changes, uniform coverage and the first ten seconds at 2 fps, then creates timestamped contact sheets (up to twelve tiles). It emits a manifest, individual frames and source captions when available. Default outputs use a new temporary directory per run. An explicit output directory is caller-owned scratch: rerunning replaces generated frames, sheets and transcript there, so never select a source directory or user-owned output. Keep outputs outside a public checkout.

Read manifest.md and transcript.txt when present, then inspect every relevant contact sheet and zoom needed individual frames. Extraction success is not watching. URL access and captions are source-dependent; local uploaded media has no automatic captions in this helper. Use available audio transcription separately. Clean up only generated scratch after required evidence has been saved.
