# Critic discipline, run evidence, state and verdict

## Single-agent inspection protocol (default)

**The same coding agent owns the entire loop:** CODE → CHECK → FIX → CHECK → POLISH → CHECK, then repeat if the actual artifact is still off. No second or third agent is needed to deliver normal QA.

After a coding/editing pass, deliberately change perspective to inspection rather than defending the implementation. Work from:
- the original brief, locked user reference and critical requirements;
- the current actual artifact revision, rendered output, and available real test commands;
- observable pass/fail conditions for each artifact type;
- a skeptical attempt to find genuine mismatches, not to produce a flattering PASS.

Record measured discrepancies with screenshots, coordinates, timestamps, test output or source-data comparisons. Fix the highest-impact one, **rerun the artifact**, inspect the affected behavior and previously passing paths, improve polish where required, and inspect the integrated result again. Repeat until every critical gate actually passes or a real blocker exists. The number of inspections is not the number of agents, and completing three passes never automatically grants PASS.

**Optional external review:** A separate critic may add another perspective if one is genuinely available and the task merits it. Provide the artifact and contract, not the builder's self-justification. It must use a truly distinct context before being called independent; otherwise describe the work as **self-review**. Never gate or pause the normal same-agent loop merely because a second model isn't installed. When specialists are used, still evaluate the whole artifact. Reject criticism unsupported by actual evidence or contrary to the owner's locked reference.

## Run record: minimal JSON-compatible format

The optional validator expects one object, roughly:

~~~json
{
  "schema_version": "1",
  "run_id": "example-local-001",
  "artifact_type": "interactive",
  "source_ref": "local-revision-r2",
  "final_revision": "r2",
  "contract": {
    "requirements": [
      {"id": "R1", "critical": true, "test": "CTA action changes visible state"}
    ]
  },
  "environment": {
    "tools_probed": ["browser with real rendering"],
    "fallbacks_attempted": []
  },
  "inspections": [
    {
      "revision": "r2",
      "method": "browser click + screenshot",
      "artifact_ref": "private/capture-r2.png",
      "state": "observed",
      "conditions": {"viewport": "1280x720"},
      "requirements_checked": ["R1"],
      "result": "pass"
    }
  ],
  "critic": {"mode": "self-review", "provenance": "single context"},
  "defects": [],
  "revisions": [],
  "verdict": "PASS",
  "limitations": [],
  "next_action": null
}
~~~

Validator checks **record consistency**, not photographic truth. An entry saying it inspected a frame doesn't prove that any frame was actually opened: keep genuine artifact/tool provenance and enforce discipline outside the JSON. Avoid including secret-bearing absolute paths or host URLs in evidence that might be made public.

Every critical requirement should have an explicit passing observed inspection tied to the **final revision**. A test of r1 does not pass r3 if the relevant code changed. If cross-revision checks are known unchanged, record supporting rationale and a final integrated smoke test before PASS.

Status values:
- PASS: all critical inspected gates observed passing for the released revision;
- NEEDS_WORK: defects remain, work continues;
- PAUSED_RECOVERABLE: paused with exact next action;
- BLOCKED_PERMISSION: only user-approved action unlocks required coverage;
- BLOCKED_ENV: technically unavailable in current authorized host after recovery attempts;
- PLATEAU_UNRESOLVED: attempted materially different fixes with no meaningful progress.

If a report has no observations, it cannot claim PASS. A known critical defect cannot be hidden by "works on my machine" or an averaged score. Negative controls for fake-pass records live in the tests.

## Evidence hierarchy

1. Real user-observed or tool-captured final artifact under known conditions.
2. Deterministic executed tests at the correct revision.
3. Reproducible external/manual critic findings with provenance.
4. Documented code inspection and causal analysis.
5. Unsupported builder claims and model confidence.

Lower classes may help choose next actions but cannot replace a missing critical higher-fidelity proof.

## Revision and integration

Preserve best candidate and necessary artifacts without overwriting private source. After each fix, inspect at least the directly affected state and a representative integrated product path, plus previously passing regressions that the change could break. If a critic reports a measured defect that conflicts with the user's artistic intent, record the conflict and evaluate against the real reference before modifying.

Use a compact summary in chat; store detailed evidence only in authorized private/ignored storage when durable state is valuable. Do not auto-commit private screenshots to public repositories.

## Independent source checks

Research, source truth and citation correctness require their own evidence chain. An independent reviewer without web/source access cannot establish external factual accuracy merely by sounding skeptical. Clearly report which source and page were actually read.
