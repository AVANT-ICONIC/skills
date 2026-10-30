---
name: anti-sloprush
description: Single-agent-first completion gate for generated or changed artifacts. Use for images, interfaces, code, research, writing and other substantial deliverables to require actual inspection, adversarial critique, repair and revision-current verification before claiming done. No extra agent, provider, browser, or paid tool required.
compatibility: Portable Agent Skills Markdown; optional stdlib Python receipt validator. Hard stop enforcement requires host hooks or CI; ChatGPT WebUI instructions are best-effort.
---

# Anti-SlopRush

**Making an artifact is NOT finishing it.** The same agent must create, observe, challenge, repair and verify its **latest** work before claiming completion. The user wants competent craft, not an apology after shipping slop.

## Authority and activation

Use as a cross-cutting *completion contract* for substantial creation, modification and release of images, visual designs, UI/apps, code, reports, research, writing, video or documents. Activate when a user demands iterative polish or accuracy. For tiny factual answers and ordinary chat use a brief internal relevance/factuality/constraint check instead of generating test artifacts. Don't invent a visual for text-only tasks; exact-output instructions govern the answer format.

**Single-agent is the default.** Use different inspection lenses in the same context; these are roles, NOT independent critics. Other agents, model judges and paid services are optional. Never claim independent verification from your own review.

**This skill owns release eligibility, not how each task is produced.** When installed, compose with `gauntlet-loop` (artifact QA), `architecture-guard` (engineering), or relevant domain skills; do not duplicate their testing procedures. If unavailable, use the focused references below and existing tools directly.

## Mandatory lifecycle

1. **LOCK**: Identify actual input reference(s), objective, immutable regions/content, user-authorized changes, critical acceptance gates, observable failure signals and risks. Preserve source identifiers; never silently substitute a different subject, style, function or source.
2. **BUILD**: Produce or modify the deliverable. Track an unambiguous revision/identifier and retain the best verified candidate. A generated image, tool success, file write, green lint or plausible prose is *unreviewed*, not PASS.
3. **OBSERVE**: Inspect the **real resulting artifact** through the available tools. For visual work open the actual output image or capture and open real rendered screenshots. For interactive work exercise behavior. For research inspect authoritative sources. For code run pertinent tests and runtime checks. A screenshot filename or tool invocation alone does not mean it was seen.
4. **ATTACK**: Switch into a skeptical critic lens. Attempt to falsify each hard gate first, then assess defects, unintended edits, integrity, polish and regressions. Name concrete evidence, location and suspected cause; never manufacture quantitative scores. If no tool can observe a required property, mark it NOT_EVALUATED.
5. **REPAIR**: Address the largest material defect, preserving frozen references and passing behavior. If the same defect persists across distinct attempts, change the method (for example, local composite instead of full-image regeneration) before trying again. Do not merely expand a prompt and declare improvement.
6. **RE-OBSERVE**: Every revision invalidates prior completion approval. Re-open/re-run the **new** artifact, recheck affected gates and likely regressions, then challenge polish again. Repeat while meaningful fixes are possible; no arbitrary mandatory count or self-congratulatory stopping.
7. **RELEASE GATE**: Only claim PASS when the latest artifact was genuinely observed, all critical gates have current evidence and pass, no material defects remain, and applicable regressions pass. Otherwise state NEEDS_WORK, CHECKPOINTED, BLOCKED or PLATEAU_UNRESOLVED with the retained best result and next concrete operation.

**Special generation rule:** After any image generation, image edit, render, export, substantial code write or substantive content draft, do not treat tool completion as answer completion. Attempt actual same-turn observation and correction before final delivery. In hosts where generation itself terminates the turn or hides the output, this cannot be mechanically overridden; do not falsely claim inspection. Resume on the next supported operation/turn with the correct unfinished status.

## Two-layer gate

**A. Hard requirements:** each critical gate is binary PASS/FAIL/NOT_EVALUATED and independently blocking. A gorgeous poster with the wrong fighter is FAIL, not a high average score. Explicit source preservation is a hard requirement, not an aesthetic preference.

**B. Craft quality:** only after hard gates pass, assess coherence, readability, typographic/layout finesse, interaction feel, completeness, defects and unintentional changes. Prefer specific defects and observable criteria over "9/10". Polish improvements must not break Layer A.

Recheck the integrated artifact, not only the edited region. Reject fake improvement where a failing condition was hidden, testing was weakened, a requirement was removed, or the judge evaluated a stale candidate.

## Evidence and release states

For substantial deliverables use a concise revision-specific receipt as described in [Evidence contract](references/evidence.md). Optional stdlib [validator](scripts/validate_receipt.py) detects missing gate coverage, stale revisions, inconsistent state and unverifiable PASS structure; it **cannot** authenticate screenshots, subjective craft, or model honesty.

- **PASS**: latest-revision critical evidence complete and gates pass, no known material issue; polish evaluated.
- **NEEDS_WORK**: known fixable defect; continue within current safe scope.
- **CHECKPOINTED**: host/tool budget or interruption; preserve exact latest revision, findings, attempted fixes and next operation; never label finished.
- **BLOCKED**: necessary capability, permission or input absent after safe alternatives; state precise missing evidence.
- **PLATEAU_UNRESOLVED**: materially different repairs failed to improve the critical defect; retain best, make failure explicit, propose method change. No fake PASS.
- **OUT_OF_SCOPE**: user did not authorize the additional change; do not expand the task to chase perfection.

Stopping should be based on evidence, safety and genuine capability limits, not a fixed pass count. Never promise endless autonomous work across host/session limits.

## Focused references

- [Visual, imagery and motion](references/visual.md)
- [Software and interaction](references/software.md)
- [Text, research and data](references/text-research.md)
- [Evidence contract and validator](references/evidence.md)
- [Recovery and host enforcement](references/recovery.md)

## Integration boundaries

A skill alone is **instruction**, not a guaranteed tool-event interceptor or stop hook. Host integrations (Claude Code, Codex, Gemini CLI, Apex, CI) may convert the receipt requirement into a real gate when supported. Do not assert a hook exists without verified current documentation. In ChatGPT WebUI, use the companion WebUI adapter where available and obey platform constraints.

A release is not approved because the assistant wrote "PASS". It is approved only to the degree supported by actual latest-revision observations and checks. Never expose sensitive evidence or upload private client assets to public repos without authorization.
