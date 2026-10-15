---
name: video-watch
description: Inspect videos from URLs or accessible local files using real timestamped frames and available audio or captions. Use for watching, summarizing, reviewing, reverse-engineering, or answering questions about visual events in a video; editor mode adds pacing metrics, a 0-10s hook breakdown, a report.md and optional Whisper transcription for creator or content analysis. A transcript alone is not a watch.
compatibility: Uses available video, image and transcript tools. Optional local extraction can use ffmpeg/ffprobe; no particular agent vendor, paid API or fixed workspace path is required.
---

# Video Watch

Actually inspect the video. Keep observed visuals, spoken or captioned content, and inference distinct.

## Answer-first fallback (mandatory)

The user's **answer** and the ability to **download video frames** are different deliverables. Video access can fail; transcript evidence already provided by the user must never be discarded.

1. **Inventory first.** Check the current message, prior visible conversation, large pasted-text attachments, uploaded `.txt`/`.vtt`/`.srt` files, previously extracted transcripts, frames and manifests **before** trying any URL. Read a complete user-supplied transcript directly rather than re-fetching it or asking for it again.
2. **Keep two independent evidence lanes.** The **transcript lane** supports dialogue, narrated events, topics, timestamps and attributed claims. The **visual lane** supports on-screen events, UI, text, imagery and actions after frames have actually been inspected. A failure in one lane must not invalidate results in the other.
3. **Produce the useful answer early.** If the question can be substantially answered from the transcript, do so, including timestamp references. Attempt visual verification only for material uncertainty or when the question explicitly demands visual details. Never finish with a wall of tool failures when a complete transcript could answer the question.
4. **Bound tool attempts.** For nonessential visual work, try one direct acquisition and at most one genuinely different, already-connected watching path if available and permitted. Do not repeatedly poll queued jobs, invent accessible URLs, demand a video upload when the transcript suffices, or silently spend metered credits.
5. **Label completeness honestly.** **VISUAL + TRANSCRIPT** means real inspected frames and transcript; **VISUAL ONLY** means inspected frames but no spoken evidence; **TRANSCRIPT ONLY** means an answer based on captions or pasted text without visual verification; **UNAVAILABLE** means neither evidence lane produced useful content. Extraction success or a queued job alone does not constitute visual inspection.

**Transcript-only is a valid completed answer for transcript-answerable questions, but is never called "watched".** Editor-mode visual/pacing deliverables remain incomplete until actual visual evidence exists. If a requested visual fact cannot be checked, state exactly that and still deliver the supported transcript-based findings. Treat auto-caption money amounts, decimals, names, and internally inconsistent arithmetic as unverified transcription rather than silently correcting them.

## Choose a mode

- **Evidence (default).** Use to answer questions about what happens, to verify, summarize, review a demo or reverse-engineer an event. Output: frames, contact sheets, manifest, captions.
- **Editor.** Use when the task is about how the video is made: creator or content analysis, pacing, hooks, retention, style, "watch it like an editor". It adds cuts/min and shot-length stats, a word-timed 0-10 s hook breakdown, `report.md` and a Whisper transcript when there are no captions.

Editor mode is evidence mode plus extras. Every rule below still applies: inspect the actual frames, keep observation apart from inference, and treat pacing numbers as measurements of scene changes, not of quality. Choose by the user's question; if unclear, start with evidence and escalate.

## Resolve the source

Use the exact attachment path or verified URL. **If pasted or attached transcript content is already available, consume it first; do not make video acquisition a prerequisite to answering.** Prefer available native video inspection. If downloading is needed, use supported tools and an authorized source; do not invent paths, bypass access controls or require a paid dependency. For local extraction, probe available ffmpeg/ffprobe first. URL acquisition may use an available yt-dlp installation.

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

For a **visual watch or editor analysis**, the requested source is resolved, relevant actual frames are inspected, available audio or captions are considered, and the answer separates observation from inference with timestamps and sampling limits.

For a **transcript-answerable question**, a source-grounded **TRANSCRIPT ONLY** answer is complete even if URL or video extraction failed, as long as visual claims are not invented, unresolved visual details are identified, and the transcript was actually read. A blocked visual tool is not grounds to discard supplied content or defer a usable answer. If neither lane yields content, state **UNAVAILABLE** and the verified blocker.

## Editor mode

Run the helper with `--mode editor`. It measures every scene change (uncapped), reports shots, cuts per minute, mean and median shot length, and writes `pacing.json` and `report.md`. The report's deterministic parts (frontmatter, pacing, transcript, frame list) are filled in; narrative sections (TL;DR, key moments, hook interpretation, style fingerprint, quotable lines, entities, concepts) are marked `pending agent fill`. Fill them only after inspecting the contact sheets and the hook frames, cite timestamps, label inference, and remove the markers you filled. Leave a marker, or say so, where you lack evidence.

Hook (0-10 s): the dense opening frames are already in the manifest (2 fps, kind `hook`). Align them to the word timing in the report when present. Name the hook pattern (question, contrarian claim, demo first, in medias res, etc.) as inference.

Transcript: captions win. With no captions, editor mode tries Whisper only if `GROQ_API_KEY` (preferred) or `OPENAI_API_KEY` is set in the environment or in `~/.config/watch/.env`. This uploads the audio track to that provider, so confirm that the user is fine with it when the video is private. `--transcribe local` additionally allows a locally installed `whisper` CLI; `--transcribe off` never transcribes. Without any of these the run still succeeds, the report says no transcript was available, and the answer must say so. No key is ever required and no paid service is used by default.

Optional export: `--export-dir DIR` copies `report.md` and the hero frames into `DIR/<title-slug>/` (for example a notes vault) with relative frame links. Nothing is exported unless the flag is given.

## Optional extraction helper

The bundled [scripts/video_watch.py](scripts/video_watch.py) requires Python 3, ffmpeg/ffprobe and Pillow. URL sources additionally need yt-dlp. Inspect available tools and use permitted environment-local installation where needed; no fixed runtime or remote helper fetch is required. The Markdown workflow also works with equivalent native tools.

```bash
python3 video-watch/scripts/video_watch.py /path/to/video.mp4 --max-frames 72
python3 video-watch/scripts/video_watch.py /path/to/video.mp4 --start 02:15 --end 02:45 --out-dir /path/to/new-run
python3 video-watch/scripts/video_watch.py URL --mode editor --intent "why does the hook work"
```

Time arguments accept seconds, MM:SS or HH:MM:SS. The frame count is a configurable sampling budget, not an agent turn limit. The helper samples scene changes, uniform coverage and the first ten seconds at 2 fps, then creates timestamped contact sheets (up to twelve tiles). It emits a manifest, individual frames and source captions when available. Default outputs use a new temporary directory per run. An explicit output directory is caller-owned scratch: rerunning replaces generated frames, sheets and transcript there, so never select a source directory or user-owned output. Keep outputs outside a public checkout.

Read manifest.md and transcript.txt when present, then inspect every relevant contact sheet and zoom needed individual frames. Extraction success is not watching. URL access and captions are source-dependent; local uploaded media has no automatic captions in this helper. Use available audio transcription separately. Clean up only generated scratch after required evidence has been saved.

## Attribution

Editor mode adapts MIT-licensed code from the `watch` skill (claude-watch). See [NOTICE](NOTICE) for the copyright line and license text. The helper modules are `scripts/video_watch.py` (entry point), `scripts/vw_editor.py` (pacing, hook words, report, export) and `scripts/vw_whisper.py` (optional transcription).
