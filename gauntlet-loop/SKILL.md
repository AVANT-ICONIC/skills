---
name: gauntlet-loop
description: "Evidence-driven artifact QA for coding agents. Use when building, revising, reviewing or releasing visual interfaces, animations, games, code, documents, data, research or other substantial artifacts whose real output must be inspected and tested. Run artifact-specific build, observe, critique, repair and regression cycles; recover broken renderers before declaring blocked. Avoid for trivial answers or where the user requested only brainstorming."
compatibility: "Portable Agent Skills Markdown. Works with available agent tools; optional Python 3 evidence validator. No API keys, paid provider, fixed browser or other installed skill required."
---

# Gauntlet Loop

**Inspect what the artifact actually does, not what the builder claims it does.** The target is observable conformance to the user's real brief and reference, with honest evidence, a retained best candidate and recovery from local tool failures.

This is a universal verification companion for substantial work. It **does not** replace the task owner's creative/design/implementation decisions; it makes those outputs stand up to scrutiny. Use with a development task or invoke directly to audit/improve an existing artifact. For reference replication, the actual reference remains the quality bar. Do not silently substitute a different theme, style, scale, feature or convenient test.

## Triggers and exclusions

Activate for work that produces or changes:
- rendered visuals, interfaces, images, logos, diagrams, animations, video, slides or PDFs;
- interactive websites, apps or games;
- substantial code changes, data analysis, documents, research deliverables and other verifiable artifacts;
- an explicit "Gauntlet", "compare with reference", "inspect before showing", "triple check", "fix until it passes" or similar request.

Skip full Gauntlet for greetings, simple text answers, speculative brainstorming without an artifact, or tasks already completely validated by equivalent applicable checks. Choose the lightest meaningful checks for simple tasks, and depth proportional to risk, exactness and user intent. Do not generate a visual simply to justify testing it.

**Hard boundary:** Do not mutate unapproved repositories, deploy, buy services, create new accounts, search for credentials, run destructive cleanup or export private material. Preserve uncommitted user work. QA may run safe temporary/isolated tooling when permitted, not bypass permissions.

## Operating contract

1. **Capture the real bar.** Extract user requirements and non-goals. Link each **critical** requirement to an observable test and falsification signal. If a screenshot, video, asset or reference exists, inspect it before deciding what success looks like. Never replace the reference with "roughly similar" without the user's authorization.
2. **Identify the artifact and host.** Establish artifact type(s), exact output revision, environment, devices/viewports/animation times and available tools. Inspect existing repo instructions and working tree before writes. Do not assume browser access, subagents, network or a production environment.
3. **Record a real baseline.** Render/open/run the current artifact in the same conditions as the requested result; inspect the actual pixels, frames, interactive states, logs, source-data relationships or runtime behavior as appropriate. Code review alone does not verify UI appearance; a static screenshot does not verify movement.
4. **Build/revise within scope.** Preserve best-known candidate and all user-important constraints. Split independent work only if parallel file ownership and shared state are safe.
5. **Critic inspects evidence.** Prefer a fresh-context independent critic where actually available, receiving the real artifact and contract but **not** the builder's justifying explanation. Add specialist lenses for geometry, motion, functionality, state, accessibility or data where useful; include at least one holistic end-to-end review when using multiple critics. If separate context is unavailable, record **self-review**, not fictional independence. Evaluate critic claims against observed evidence.
6. **Repair the highest-impact actual gaps.** Rank defects by critical/major/minor plus consequence. Fix causes rather than aesthetic guesses. Re-render/re-execute under matched conditions. Re-check prior passing requirements and inspect the integrated product, not merely a convenient component.
7. **Continue while warranted.** Meaningful pass = observed output + recorded discrepancy (or proven exactness) + targeted correction if needed + new observation if changed. For substantial new visual artifacts, aim for **at least three meaningful inspection passes**, not three blind generations or a three-attempt finish line. Continue beyond three if material gaps remain and approaches are improving. A verified exact result does not require pointless edits.
8. **Close honestly.** PASS requires actual evidence for **every critical gate**, no known critical defect and relevant integrated/regression checks. Otherwise keep an explicit incomplete verdict and a concrete next operation. Do not label uninspected outputs verified.

## Artifact-specific verification

Read only the relevant references instead of loading everything:
- [Visual & motion](references/visual-motion.md): screenshot fidelity, image inspection, animation timeline, visual references, responsive composition.
- [Interaction & games](references/interactive-game.md): real input/output, Canvas/WebGL coverage, gameplay agency, user interaction, progress and actual fun evidence.
- [Code, data, documents & research](references/other-artifacts.md): actual runtime tests, data integrity, rendered documents, citations and correctness.
- [Recovery & execution](references/recovery.md): troubleshoot browsers/profiles/permission/toolchain, budgets, isolated setup, resumable checkpoint.
- [Critics & evidence](references/evidence.md): adversarial reviews, evidence structure, run validity, integrity and final verdicts.

Treat multi-type artifacts as a union of their gates. A visually attractive game might pass screenshot fidelity yet fail gameplay-interest or state-transition requirements.

## Capability probe: don't confuse broken setup with impossibility

Check the capabilities that matter for the target: local files and executable commands, browser engine/profile, Playwright or equivalent, headless/offscreen capture, Canvas/WebGL rendering, desktop app or emulator, network access, ffmpeg/video frame sampling, document rendering, test runner and potential distinct agent contexts. **Probe first; do not assume any are installed.**

If the preferred route fails: inspect logs/config/profile/version/path and dependency setup, try an isolated session/profile, appropriate alternate installed browser/renderer, permitted free project-local setup or another authorized execution environment. Browser engines are **not interchangeable proofs**: a DOM-only parser cannot establish that a Canvas/WebGL game visually rendered. A frame capture cannot prove animation timing. Do not loop on the same error. Never install paid tooling or globally alter the machine without the required approval.

See [recovery](references/recovery.md) for a problem-focused ladder and a runnable checkpoint format.

## Evidence, verdicts and checkpoints

For nontrivial runs use a small evidence record that identifies:
- artifact and revision, authentic reference and critical requirements;
- methods actually run and outputs actually observed, including relevant viewport/timestamps/state/test exit;
- critic provenance (independent / self-review / external human);
- measured or reproducible defects, attempts, best version and regressions;
- current verdict, missing gates, and exact next step.

The optional standard-library validator is at [scripts/validate_evidence.py](scripts/validate_evidence.py). It rejects invented *structural* claims such as PASS without observations; it does **not** independently judge truth or certify aesthetics.

For **self-contained HTML synthetic QA fixtures**, the optional [browser probe](scripts/web_probe.py) can capture actual Chromium screenshots at multiple viewports, compare a critical target's bounds with clipping ancestors, exercise a click that must change visible state, sample CSS animation frames, and recover from a missing initial Chromium executable by probing actual local installations. Example (after separately installing free Python Playwright and Chromium in an authorized isolated environment):

~~~bash
python3 gauntlet-loop/scripts/web_probe.py \
  --html /private/synthetic-fixture.html --out /private/evidence-run \
  --viewport 1280x800 --viewport 390x844 \
  --target '#primary-action' --action '#primary-action' --state '#status'
~~~

If keyboard activation is a critical requirement for the selected action, add `--keyboard` (together with `--action` and `--state`): the probe checks **real Tab traversal and Enter-triggered state change** in a fresh Chromium page at each viewport and captures focused/after-Enter screenshots. A clickable `div role="button"` can pass mouse checks while ignoring Enter; merely adding `tabindex` does not make it keyboard-operable. The saved screenshots still require actual visual inspection for focus-ring quality. Do not apply this flag to actions for which Enter is not an expected input.

For a user-requested **modal dialog** with required keyboard accessibility, add `--dialog '#modal-id'` together with `--action` (the opener) and `--state` (visible status). The probe opens the dialog in a fresh page, checks that focus enters it, Tab stays inside, Escape closes it, and focus returns to the opener. It captures the open and after-Escape states. **This is a narrow modal-lifecycle check**, not a complete accessibility audit: it does not alone prove screen-reader semantics, pointer blocking, focus-visible quality, or all browser/assistive-technology behavior. Use only where Escape dismissal and focus restoration are actual requirements, and inspect the screenshots yourself.

For an expected **Canvas 2D** graphic, add `--canvas2d '#scene'` and optionally `--canvas-min-colors N` (default 2). The probe checks **actual drawn non-transparent pixels** in a bounded downsampled 2D Canvas image rather than trusting element geometry or CSS background decoration. This catches a visible, styled but empty canvas, but does **not** certify graphics correctness, animation quality, matching reference shapes, or WebGL output; inspect the actual screenshots. A blank or monochrome canvas can be intentional, so enable this only when real multicolor 2D content is required (set `--canvas-min-colors 1` if one color is legitimate). A different/tainted/unavailable 2D context must not be mistaken for a successful canvas inspection. **WebGL requires a suitable real GPU/software graphics environment and a separate validated pixel capture path.**

For **source-to-summary data integrity**, the optional zero-dependency [JSON aggregate auditor](scripts/audit_aggregate.py) recomputes signed integer event totals by group from raw records, detects identical duplicate events, counts negative adjustments, and compares every declared metric to the published summary. Use it only if the source data **actually fits its event-ledger contract**. Example:

~~~bash
python3 gauntlet-loop/scripts/audit_aggregate.py \
  --source /private/raw-events.json \
  --report /private/published-summary.json \
  --out /private/data-audit.json
~~~

Return codes: **0** = `CHECKS_PASS_SOURCE_RECONCILED` (source/report agree; not proof source is true or chart visually correct), **1** = `CHECKS_FAIL` with mismatched quantities, **2** = `BLOCKED_DATA` for malformed/ambiguous source or report. A duplicate event ID with differing row content must not be silently discarded. This intentionally narrow tool is **not** appropriate for money/floats, arbitrary spreadsheets, or domain-specific accounting without a separately designed contract and tests. See [other artifacts](references/other-artifacts.md) for broader verification.

**This does not automate a critic.** The caller must open and inspect captured screenshots, motion samples and the actual browser-test JSON, and must never treat `CHECKS_PASS_REVIEW_PIXELS` as verified PASS. `page.set_content` renders self-contained HTML only, not a deployment's origin, CSP, service worker, network or external asset behavior. The probe is optional; unsupported platforms use equivalent suitable tools or an honest non-PASS handoff. Never call a schema-valid record proof that the screenshots or tests were genuine.

**Verdicts:**
- **PASS:** all critical gates actually inspected and passed for identified version; no known critical regressions.
- **NEEDS_WORK:** defect is identified and work can continue.
- **PAUSED_RECOVERABLE:** time/tool budget reached; best version and exact next action saved.
- **BLOCKED_PERMISSION:** further verification requires user-approved action (system privilege, credentials, spend, external access).
- **BLOCKED_ENV:** safe authorized options genuinely exhausted and a required proof remains unrun.
- **PLATEAU_UNRESOLVED:** multiple materially different repair attempts did not improve the major defect; switch strategy or hand off with failing gates visible, never silently PASS.

Convey missing evidence plainly. Partial artifacts may be presented only with an obvious **unverified** label when useful and appropriate, not as the promised finished result.

## Output

Use a concise operator summary without performance theater:

~~~text
ARTIFACT       what and exact revision
REFERENCE      user's actual target (if one exists)
EVIDENCE       actual renders/tests/interactions seen
CRITICAL GATES PASS / FAIL / NOT_RUN with brief reasons
DEFECTS        prioritized causal issues
REVISIONS      key changes; preserved best artifact
VERDICT        PASS / NEEDS_WORK / PAUSED_RECOVERABLE /
               BLOCKED_PERMISSION / BLOCKED_ENV / PLATEAU_UNRESOLVED
NEXT           one executable operation if not PASS
~~~

Do not invent confidence percentages, fake reviewers, unobserved frames, tests that never ran or remote availability. If this skill is installed beside \`visual-output\`, it may enrich the *chat presentation*, but it does not replace evidence or require that companion.

## Further safety

Never alter a user's working baseline merely to run a comparison; use an authorized disposable worktree/copy when necessary. Never auto-commit generated screenshots or logs to a public repository. Keep private evidence in approved ignored/local/private storage. Test the final integrated artifact, not just a subcomponent that accidentally passes. Relevant examples and host-dependent instructions live in the references, not in user-specific examples.
