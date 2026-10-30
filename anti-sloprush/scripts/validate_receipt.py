#!/usr/bin/env python3
"""Validate Anti-SlopRush v1 receipts. Structural truthfulness only, never pixel truth."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCHEMA = "anti-sloprush-receipt/v1"
VERDICTS = {"PASS", "NEEDS_WORK", "CHECKPOINTED", "BLOCKED", "PLATEAU_UNRESOLVED"}
STATUS = {"PASS", "FAIL", "NOT_EVALUATED"}
METHODS = {
    "opened-image", "opened-screenshot", "played-video", "sampled-frames",
    "executed-test", "exercised-interaction", "inspected-source",
    "inspected-document", "recomputed-data", "manual-observation",
}


def inspect(receipt: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(receipt, dict):
        return ["receipt must be an object"]
    if receipt.get("schema") != SCHEMA:
        errors.append("invalid schema")
    artifact = receipt.get("artifact")
    if not isinstance(artifact, dict) or not all(
        isinstance(artifact.get(k), str) and artifact[k].strip()
        for k in ("id", "revision", "kind")
    ):
        errors.append("artifact must have nonempty id, revision, kind")
        revision = None
    else:
        revision = artifact["revision"]
    verdict = receipt.get("verdict")
    if verdict not in VERDICTS:
        errors.append("invalid verdict")
    if receipt.get("review_provenance") not in {"single-agent", "independent-review"}:
        errors.append("invalid review_provenance")
    observations = receipt.get("observations")
    if not isinstance(observations, list):
        errors.append("observations must be an array")
        observations = []
    indexed: dict[str, dict] = {}
    for index, item in enumerate(observations):
        if not isinstance(item, dict) or not all(
            isinstance(item.get(k), str) and item[k].strip()
            for k in ("id", "revision", "method", "ref")
        ):
            errors.append(f"observation[{index}] missing id/revision/method/ref")
            continue
        if item["id"] in indexed:
            errors.append(f"duplicate observation {item['id']}")
        if item["method"] not in METHODS:
            errors.append(f"unsupported observation method {item['method']}")
        indexed[item["id"]] = item

    def check_evidence(obj: dict, label: str, require: bool) -> None:
        ids = obj.get("evidence_ids", [])
        if not isinstance(ids, list) or (require and not ids) or any(
            not isinstance(x, str) or not x for x in ids
        ):
            errors.append(f"{label}: missing or invalid evidence_ids")
            return
        if len(ids) != len(set(ids)):
            errors.append(f"{label}: duplicate evidence_ids")
        for eid in ids:
            observation = indexed.get(eid)
            if observation is None:
                errors.append(f"{label}: missing observation {eid}")
            elif observation["revision"] != revision:
                errors.append(f"{label}: stale observation {eid}")

    gates = receipt.get("critical_gates")
    if not isinstance(gates, list):
        errors.append("critical_gates must be an array")
        gates = []
    seen: set[str] = set()
    for index, gate in enumerate(gates):
        if not isinstance(gate, dict) or not isinstance(gate.get("id"), str) or not gate["id"]:
            errors.append(f"critical_gates[{index}]: missing id")
            continue
        if gate["id"] in seen:
            errors.append(f"duplicate critical gate {gate['id']}")
        seen.add(gate["id"])
        if gate.get("status") not in STATUS:
            errors.append(f"{gate['id']}: invalid status")
        check_evidence(gate, gate["id"], gate.get("status") == "PASS")

    for section in ("craft", "regressions"):
        value = receipt.get(section)
        if not isinstance(value, dict) or value.get("status") not in STATUS:
            errors.append(f"{section}: missing or invalid status")
            continue
        check_evidence(value, section, value["status"] == "PASS")

    defects = receipt.get("defects", [])
    if not isinstance(defects, list):
        errors.append("defects must be an array")
        defects = []
    for index, defect in enumerate(defects):
        if not isinstance(defect, dict) or defect.get("severity") not in {
            "material", "minor"
        } or defect.get("status") not in {"open", "fixed", "deferred"}:
            errors.append(f"defects[{index}]: invalid defect")

    if verdict == "PASS":
        if not gates:
            errors.append("PASS requires at least one critical gate")
        if not indexed:
            errors.append("PASS requires an observation")
        if any(g.get("status") != "PASS" for g in gates if isinstance(g, dict)):
            errors.append("PASS requires all critical gates to PASS")
        for section in ("craft", "regressions"):
            if not isinstance(receipt.get(section), dict) or receipt[section].get("status") != "PASS":
                errors.append(f"PASS requires {section} PASS")
        if any(
            isinstance(d, dict) and d.get("severity") == "material"
            and d.get("status") != "fixed"
            for d in defects
        ):
            errors.append("PASS cannot contain unresolved material defects")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("receipt", type=Path)
    parser.add_argument("--require-pass", action="store_true")
    args = parser.parse_args(argv)
    try:
        receipt = json.loads(args.receipt.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1
    errors = inspect(receipt)
    if errors:
        for error in errors:
            print(f"INVALID: {error}", file=sys.stderr)
        return 1
    if args.require_pass and receipt["verdict"] != "PASS":
        print(f"NOT_APPROVED: {receipt['verdict']}")
        return 2
    print(f"STRUCTURE_OK: {receipt['verdict']} (not independent artifact verification)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
