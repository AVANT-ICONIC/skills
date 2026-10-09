#!/usr/bin/env python3
"""Optional source-to-summary reconciliation for integer-valued JSON event ledgers.

No third-party dependencies. This checks that a report agrees with its supplied
source records, NOT that source events occurred or that every real-world event
was captured. A self-consistent chart or totals table is not source evidence.

Usage:
  python3 gauntlet-loop/scripts/audit_aggregate.py \
    --source ledger_source.json --report report.json --out audit_result.json

The report supplies id_field, group_field and value_field; users must validate
those field definitions against their actual data contract. Duplicate IDs are
ignored ONLY if their full source records are identical; conflicts block audit.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

METRICS = {"source_rows", "unique_events", "duplicate_rows", "negative_events", "net_total", "net_by_group"}
FIELDS = {"schema_version", "id_field", "group_field", "value_field", "metrics"}


class InvalidArtifact(Exception):
    """An input/report can't be meaningfully audited under this schema."""


def load(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise InvalidArtifact(f"cannot read valid JSON from {path.name}: {exc}") from exc


def require_nonempty_text(obj: dict, key: str, location: str) -> str:
    val = obj.get(key)
    if not isinstance(val, str) or not val.strip():
        raise InvalidArtifact(f"{location}.{key} must be a nonempty string")
    return val


def strict_integer(val: object) -> bool:
    return type(val) is int


def compute(source: object, report: object) -> dict:
    if not isinstance(report, dict):
        raise InvalidArtifact("report must be a JSON object")
    if set(report) != FIELDS:
        raise InvalidArtifact(f"report keys must be exactly {sorted(FIELDS)!r}")
    if report.get("schema_version") != "1":
        raise InvalidArtifact("report.schema_version must be '1'")
    id_field = require_nonempty_text(report, "id_field", "report")
    group_field = require_nonempty_text(report, "group_field", "report")
    value_field = require_nonempty_text(report, "value_field", "report")
    if len({id_field, group_field, value_field}) != 3:
        raise InvalidArtifact("id_field, group_field, value_field must be distinct")
    metrics = report.get("metrics")
    if not isinstance(metrics, dict) or set(metrics) != METRICS:
        raise InvalidArtifact(f"report.metrics must have exactly {sorted(METRICS)!r}")
    for key in METRICS - {"net_by_group"}:
        if not strict_integer(metrics[key]):
            raise InvalidArtifact(f"report.metrics.{key} must be an integer (not float or boolean)")
    published_groups = metrics["net_by_group"]
    if not isinstance(published_groups, dict) or not published_groups:
        raise InvalidArtifact("report.metrics.net_by_group must be a nonempty group mapping")
    for name, value in published_groups.items():
        if not isinstance(name, str) or not name.strip() or not strict_integer(value):
            raise InvalidArtifact("report.metrics.net_by_group keys must be names, values integer")
    if not isinstance(source, dict) or not isinstance(source.get("records"), list):
        raise InvalidArtifact("source must be an object containing a records array")
    records = source["records"]
    if not records:
        raise InvalidArtifact("source.records must not be empty; empty-dataset contract not specified")
    unique: dict[str, dict] = {}
    duplicate_rows = 0
    for i, row in enumerate(records):
        loc = f"source.records[{i}]"
        if not isinstance(row, dict):
            raise InvalidArtifact(f"{loc} must be an object")
        event_id = require_nonempty_text(row, id_field, loc)
        group = require_nonempty_text(row, group_field, loc)
        value = row.get(value_field)
        if not strict_integer(value):
            raise InvalidArtifact(f"{loc}.{value_field} must be an integer (not float/boolean)")
        if event_id in unique:
            if row != unique[event_id]:
                raise InvalidArtifact(f"duplicate event id {event_id!r} has conflicting source rows")
            duplicate_rows += 1
        else:
            unique[event_id] = row
    by_group: dict[str, int] = {}
    negative_events = 0
    for row in unique.values():
        group = row[group_field]
        value = row[value_field]
        by_group[group] = by_group.get(group, 0) + value
        if value < 0:
            negative_events += 1
    expected = {
        "source_rows": len(records),
        "unique_events": len(unique),
        "duplicate_rows": duplicate_rows,
        "negative_events": negative_events,
        "net_total": sum(by_group.values()),
        "net_by_group": dict(sorted(by_group.items())),
    }
    errors: list[dict] = []
    for key in sorted(METRICS - {"net_by_group"}):
        if expected[key] != metrics[key]:
            errors.append({"field": f"metrics.{key}", "expected": expected[key], "reported": metrics[key]})
    if expected["net_by_group"] != metrics["net_by_group"]:
        errors.append({
            "field": "metrics.net_by_group", "expected": expected["net_by_group"],
            "reported": dict(sorted(published_groups.items())),
        })
    return {
        "verdict": "CHECKS_FAIL" if errors else "CHECKS_PASS_SOURCE_RECONCILED",
        "errors": errors, "expected": expected,
        "contract": {"id_field": id_field, "group_field": group_field, "value_field": value_field,
                     "duplicate_policy": "identical_rows_only", "value_type": "signed_integer"},
        "limitations": [
            "Reconciles only the supplied source and declared grouping; does not prove source completeness or real-world truth.",
            "Not for floats, currencies with non-integer units, complex reversals or multi-currency accounting without custom contract.",
            "Passing JSON reconciliation does not prove generated charts, screenshots or documents show the same values.",
        ],
    }


def audit(source: object, report: object) -> dict:
    try:
        return compute(source, report)
    except InvalidArtifact as exc:
        return {"verdict": "BLOCKED_DATA", "errors": [{"field": "input", "reason": str(exc)}],
                "limitations": ["Source or report cannot be audited; this is not a verified product failure or success."]}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source", type=Path, required=True)
    p.add_argument("--report", type=Path, required=True)
    p.add_argument("--out", type=Path, help="Output audit evidence JSON; optional")
    args = p.parse_args(argv)
    try:
        source, report = load(args.source), load(args.report)
        result = audit(source, report)
    except InvalidArtifact as exc:
        result = {"verdict": "BLOCKED_DATA", "errors": [{"field": "input", "reason": str(exc)}],
                  "limitations": ["Cannot read source or report; no reconciliation performed."]}
    output = json.dumps(result, indent=2, sort_keys=True)
    if args.out:
        try:
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(output + "\n", encoding="utf-8")
        except OSError as exc:
            print(f"could not save evidence: {exc}", file=sys.stderr)
            return 2
    print(output)
    return {"CHECKS_PASS_SOURCE_RECONCILED": 0, "CHECKS_FAIL": 1, "BLOCKED_DATA": 2}[result["verdict"]]


if __name__ == "__main__":
    raise SystemExit(main())
