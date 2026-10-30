# Evidence contract and machine-readable receipt

The **acceptance contract** is defined before artifact creation and should live outside the builder's mutable receipt. For hard gates in automation use a trusted, frozen contract whose integrity is enforced by the host/CI. A single agent can draft it, but must not silently weaken it after work starts. Example:

```json
{
  "schema": "anti-sloprush-contract/v1",
  "artifact_id": "poster.png",
  "critical_gate_ids": ["identity-left", "identity-right"]
}
```

The receipt is optional for tiny answers but recommended for substantial artifacts and required when using a mechanical release gate. It is **not an aesthetic oracle**. Example:

```json
{
  "schema": "anti-sloprush-receipt/v1",
  "artifact": {"id": "poster.png", "revision": "sha256:abc123", "kind": "image"},
  "review_provenance": "single-agent",
  "observations": [
    {"id": "obs-1", "revision": "sha256:abc123", "method": "opened-image", "ref": "private/qa/poster-final.png"}
  ],
  "critical_gates": [
    {"id": "identity-left", "status": "PASS", "evidence_ids": ["obs-1"]},
    {"id": "identity-right", "status": "PASS", "evidence_ids": ["obs-1"]}
  ],
  "craft": {"status": "PASS", "evidence_ids": ["obs-1"]},
  "regressions": {"status": "PASS", "evidence_ids": ["obs-1"]},
  "defects": [],
  "verdict": "PASS"
}
```

- **Gate ID** must correspond to a real locked requirement; no generic "quality fine" dummy gate.
- Observation refs must identify an actual opened/seen output, executed test or inspected source. For images a capture path alone does not prove it was inspected; the agent must actively open it.
- Observation revision, gate evidence, craft evidence and regression evidence must agree with latest artifact revision.
- Every critical requirement has its own gate: FAIL/NOT_EVALUATED block PASS.
- Do not invent materiality percentages. A material open defect blocks PASS.
- Review provenance is `single-agent` unless an actually separate context was used. An internal switch of roles is still `single-agent`.
- `craft` acknowledges subjective inspection, not a certified score.
- `regressions` must be checked again after a revision; `PASS` cannot reuse stale evidence.
- `CHECKPOINTED`, `BLOCKED`, `NEEDS_WORK` and `PLATEAU_UNRESOLVED` retain gaps and next action; they are not release approval.
- Records are evidence metadata, not claims that the validator verified image identity or factual correctness.

Run `python3 anti-sloprush/scripts/validate_receipt.py path/to/receipt.json --contract path/to/locked-contract.json --require-pass`. `0` = structurally valid PASS; `2` = valid non-PASS; `1` = invalid (including false/stale PASS). A validator verifies **claim consistency only**, never the truth of external observation records.
