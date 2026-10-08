# Verification for code, documents, data, research and writing

Universal QA is **artifact-specific**. A generic quality score or a screenshot is not an adequate substitute for the checks below.

## Code and architecture

- Identify current commit/working-tree status and target platform.
- Derive tests from intended observable behavior, including a negative/edge case and integration path, not merely tests that mirror implementation logic.
- Run the real build, unit, integration, lint/type checks where relevant; report exact command, exit result and revision. Do not cite a historical passing test as proof of new code.
- Inspect runtime behavior, failure recovery, migration compatibility and generated files within scope.
- For performance claims measure baseline and candidate under comparable environment/load; do not invent measurements.
- Regressions: rerun affected previous tests plus one integrated end-to-end path. Preserve original behavior except approved changes.
- If user asks whether architecture tolerates future change and a dedicated future-change experiment skill is installed, delegate there; this skill does not silently manufacture live production changes.

## Data and spreadsheets

- Establish source rows/records and filtering, deduplication, units, dates and missing values.
- Recompute independent totals or sample edge cases; cross-check aggregation with raw source.
- Check formula ranges, reference anchors, types, sorting and handling of zero/negative/blank values.
- Check chart labels, scales, data coverage and output rendered/readable form; a pretty chart with wrong source totals is a FAIL.
- Avoid fake numeric confidence. When samples are partial, label coverage rather than saying "verified all".

## Documents, slides and PDFs

- Check semantic content, ordering, headings, tables, page breaks, dimensions and any relevant accessibility.
- Render actual pages/slides or open exports, inspect clipping, font fallback, empty sections, overlaps, raster quality, contrast and legibility.
- Verify that the generated file opens and, where editable deliverables are requested, retains useful editing structure rather than offering only a flattened image.
- Check citations/links and calculations used in the document separately from its appearance.
- A successful export process is not proof the rendered document looks correct; visually inspect.

## Research and factual deliverables

- Trace source assertions to reliable evidence with accurate citations; distinguish direct evidence, inference and unknown.
- Check recency and source suitability for changing facts.
- Compare competing credible views fairly on contested topics and record unresolved uncertainty.
- Verify quoted/derived claims against actual materials rather than plausible-sounding paraphrases.
- Preserve limits and avoid claiming a source was viewed when access failed.

## Creative writing / editorial content

- Follow exact user constraints and audience/voice/tone, keep internal coherence and genuine narrative or persuasive causality.
- Compare to provided reference for characteristics rather than duplicating copyrighted text.
- An external proofreader or distinct critic may improve results but isn't automatically a factual authority.
- Check revisions for broken structure, repetition and unintended style shifts.

## Minimal evidence per domain

~~~text
ARTIFACT   version/format/revision
CONTRACT   observable target and negative conditions
CHECKS     exact actual method; pass/fail/not_run
EVIDENCE   observed log/row/page/source reference
DEFECTS    what failed, fix, regression impact
VERDICT    PASS or honest incomplete status
~~~

False positives to reject: "all tests pass" when not run, a summary computed from uninspected source data, a presentation declared visually polished based only on file generation, or a citation to an article never opened.
