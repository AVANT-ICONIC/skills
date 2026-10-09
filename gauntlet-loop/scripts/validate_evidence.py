#!/usr/bin/env python3
"""Check structural consistency of a Gauntlet evidence record.

This does NOT verify that screenshots, inspections or test runs are genuine.
It catches missing records and internally contradictory PASS claims.
Requires only Python 3 standard library.

Usage:
    python3 gauntlet-loop/scripts/validate_evidence.py path/to/run.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

VERDICTS = {
    "PASS",
    "NEEDS_WORK",
    "PAUSED_RECOVERABLE",
    "BLOCKED_PERMISSION",
    "BLOCKED_ENV",
    "PLATEAU_UNRESOLVED",
}
ARTIFACTS = {
    "visual",
    "animation",
    "interactive",
    "game",
    "code",
    "document",
    "data",
    "research",
    "other",
}
SEVERITIES = {"critical", "major", "minor"}
DEFECT_STATES = {"open", "fixed", "wontfix-with-reason"}
RESULTS = {"pass", "fail", "inconclusive"}


def is_text(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate(record: object) -> list[str]:
    """Return all visible schema/logic errors; never assert artifact truth."""
    errors: list[str] = []

    if not isinstance(record, dict):
        return ["root must be a JSON object"]
    if record.get("schema_version") != "1":
        errors.append("schema_version must be the string '1'")
    for field in ("run_id", "source_ref"):
        if not is_text(record.get(field)):
            errors.append(f"{field} must be a nonempty string")
    artifact_type = record.get("artifact_type")
    if not isinstance(artifact_type, str) or artifact_type not in ARTIFACTS:
        errors.append(f"artifact_type must be one of {', '.join(sorted(ARTIFACTS))}")

    verdict = record.get("verdict")
    if not isinstance(verdict, str) or verdict not in VERDICTS:
        errors.append(f"verdict must be one of {', '.join(sorted(VERDICTS))}")

    contract = record.get("contract")
    requirements = contract.get("requirements") if isinstance(contract, dict) else None
    if not isinstance(requirements, list) or not requirements:
        errors.append("contract.requirements must contain at least one requirement")
        requirements = []

    ids: set[str] = set()
    critical: set[str] = set()
    for i, item in enumerate(requirements):
        location = f"contract.requirements[{i}]"
        if not isinstance(item, dict):
            errors.append(f"{location} must be an object")
            continue
        rid = item.get("id")
        if not is_text(rid):
            errors.append(f"{location}.id must be nonempty")
            continue
        if rid in ids:
            errors.append(f"duplicate requirement id {rid!r}")
        ids.add(rid)
        if not isinstance(item.get("critical"), bool):
            errors.append(f"{location}.critical must be boolean")
        elif item["critical"]:
            critical.add(rid)
        if not is_text(item.get("test")):
            errors.append(f"{location}.test must explain an observable check")

    environment = record.get("environment")
    if not isinstance(environment, dict):
        errors.append("environment must be an object")
    else:
        for field in ("tools_probed", "fallbacks_attempted"):
            if not isinstance(environment.get(field), list):
                errors.append(f"environment.{field} must be a list")

    inspector_records = record.get("inspections")
    if not isinstance(inspector_records, list):
        errors.append("inspections must be a list")
        inspector_records = []

    final_revision = record.get("final_revision")
    if verdict == "PASS" and not is_text(final_revision):
        errors.append("PASS needs final_revision as an explicit artifact revision")

    passed: set[str] = set()
    failed_or_unrun: set[str] = set()
    for i, item in enumerate(inspector_records):
        location = f"inspections[{i}]"
        if not isinstance(item, dict):
            errors.append(f"{location} must be an object")
            continue
        for field in ("revision", "method", "artifact_ref"):
            if not is_text(item.get(field)):
                errors.append(f"{location}.{field} must be nonempty")
        if item.get("state") not in ("observed", "not_run"):
            errors.append(f"{location}.state must be observed or not_run")
        if not isinstance(item.get("conditions"), dict):
            errors.append(f"{location}.conditions must be an object")
        check_ids = item.get("requirements_checked")
        if not isinstance(check_ids, list):
            errors.append(f"{location}.requirements_checked must be a list")
            check_ids = []
        for rid in check_ids:
            if not isinstance(rid, str) or rid not in ids:
                errors.append(f"{location} refers to unknown requirement {rid!r}")
        if not isinstance(item.get("result"), str) or item["result"] not in RESULTS:
            errors.append(f"{location}.result must be pass/fail/inconclusive")
        if (
            verdict == "PASS"
            and item.get("state") == "observed"
            and item.get("result") == "pass"
            and item.get("revision") == final_revision
            and is_text(item.get("method"))
            and is_text(item.get("artifact_ref"))
        ):
            passed.update(rid for rid in check_ids if isinstance(rid, str) and rid in critical)
        if (
            verdict == "PASS"
            and item.get("revision") == final_revision
            and (item.get("state") != "observed" or item.get("result") != "pass")
        ):
            failed_or_unrun.update(rid for rid in check_ids if isinstance(rid, str) and rid in critical)

    if verdict == "PASS":
        if not inspector_records:
            errors.append("PASS cannot have zero inspections")
        if not critical:
            errors.append("PASS must declare at least one critical observable requirement")
        for rid in sorted(failed_or_unrun):
            errors.append(f"critical requirement {rid!r} has a failing or unrun inspection at final_revision")
        for rid in sorted(critical - passed):
            errors.append(f"critical requirement {rid!r} has no observed PASS at final_revision")
        if record.get("next_action") is not None:
            errors.append("PASS next_action must be null")
    elif isinstance(verdict, str) and verdict in VERDICTS and not is_text(record.get("next_action")):
        errors.append(f"{verdict} needs a specific nonempty next_action")

    critic = record.get("critic")
    if not isinstance(critic, dict) or critic.get("mode") not in (
        "independent",
        "self-review",
        "external-user",
    ):
        errors.append("critic.mode must be independent/self-review/external-user")
    elif not is_text(critic.get("provenance")):
        errors.append("critic.provenance must identify the actual reviewer/context")

    defects = record.get("defects")
    if not isinstance(defects, list):
        errors.append("defects must be a list")
        defects = []
    for i, defect in enumerate(defects):
        loc = f"defects[{i}]"
        if not isinstance(defect, dict):
            errors.append(f"{loc} must be an object")
            continue
        if not is_text(defect.get("id")):
            errors.append(f"{loc}.id must be nonempty")
        if not isinstance(defect.get("severity"), str) or defect["severity"] not in SEVERITIES:
            errors.append(f"{loc}.severity invalid")
        if not isinstance(defect.get("status"), str) or defect["status"] not in DEFECT_STATES:
            errors.append(f"{loc}.status invalid")
        if not is_text(defect.get("evidence")):
            errors.append(f"{loc}.evidence must describe a real failure")
        rid = defect.get("requirement_id")
        if rid is not None and (not isinstance(rid, str) or rid not in ids):
            errors.append(f"{loc}.requirement_id unknown")
        if (
            verdict == "PASS"
            and defect.get("status") == "open"
            and defect.get("severity") in ("critical", "major")
        ):
            errors.append("PASS incompatible with open critical/major defect")

    if not isinstance(record.get("revisions"), list):
        errors.append("revisions must be a list")
    if not isinstance(record.get("limitations"), list):
        errors.append("limitations must be a list")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path, help="Path to one Gauntlet JSON record")
    args = parser.parse_args(argv)
    try:
        record = json.loads(args.file.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(f"INVALID {args.file}: {exc}", file=sys.stderr)
        return 2
    errors = validate(record)
    if errors:
        print(f"INVALID {args.file}:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(
        f"RECORD VALID: {args.file} (verdict: {record.get('verdict')}; "
        "this does NOT prove tool runs or visual truth)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
