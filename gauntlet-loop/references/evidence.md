# Critic discipline, run evidence, state and verdict

## Critic protocol

Separate builder rationale from criticism. Give a critic:
- the original brief and locked user reference;
- which artifact revision must be inspected and how to obtain real output;
- observable pass/fail conditions and relevant test matrix;
- an explicit mandate to find falsifiable critical defects, not praise the builder.

**Do not include:** the builder's claim "this is already perfect", a list of excuses, or a prefabricated PASS verdict. The independent critic must operate in a distinct context/process when support truly exists. Otherwise label a same-context review **self-review**. If multiple specialists are used, include an unguided holistic review of the whole artifact. Require concrete location/timestamp/test/evidence for alleged failures and record why suggestions were accepted or rejected.

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
