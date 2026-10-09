#!/usr/bin/env python3
"""Standard-library negative controls for the optional Gauntlet record validator."""

from __future__ import annotations

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from validate_evidence import validate


def valid_record() -> dict:
    return {
        "schema_version": "1",
        "run_id": "synthetic-001",
        "artifact_type": "interactive",
        "source_ref": "revision-r2",
        "final_revision": "r2",
        "contract": {
            "requirements": [
                {"id": "R1", "critical": True, "test": "click changes visible state"},
                {"id": "R2", "critical": True, "test": "rendered layout fits screen"},
            ]
        },
        "environment": {
            "tools_probed": ["real browser"],
            "fallbacks_attempted": [],
        },
        "inspections": [
            {
                "revision": "r2",
                "method": "browser screenshot and click",
                "artifact_ref": "private/capture-r2.png",
                "state": "observed",
                "conditions": {"viewport": "1280x720"},
                "requirements_checked": ["R1", "R2"],
                "result": "pass",
            }
        ],
        "critic": {"mode": "self-review", "provenance": "one agent + tests"},
        "defects": [],
        "revisions": [],
        "verdict": "PASS",
        "limitations": [],
        "next_action": None,
    }


class EvidenceValidatorTests(unittest.TestCase):
    def reject(self, record: dict, expected: str) -> None:
        messages = validate(record)
        self.assertTrue(
            any(expected in msg for msg in messages),
            f"expected {expected!r}; got {messages!r}",
        )

    def test_good_pass_record(self) -> None:
        self.assertEqual([], validate(valid_record()))

    def test_no_inspections_not_pass(self) -> None:
        r = valid_record()
        r["inspections"] = []
        self.reject(r, "zero inspections")

    def test_wrong_revision_does_not_pass(self) -> None:
        r = valid_record()
        r["inspections"][0]["revision"] = "r1"
        self.reject(r, "no observed PASS at final_revision")

    def test_unobserved_not_pass(self) -> None:
        r = valid_record()
        r["inspections"][0]["state"] = "not_run"
        self.reject(r, "no observed PASS at final_revision")

    def test_partial_requirements_not_pass(self) -> None:
        r = valid_record()
        r["inspections"][0]["requirements_checked"] = ["R1"]
        self.reject(r, "critical requirement 'R2'")

    def test_unknown_gate_rejected(self) -> None:
        r = valid_record()
        r["inspections"][0]["requirements_checked"] = ["UNKNOWN"]
        self.reject(r, "unknown requirement")

    def test_duplicate_requirements_rejected(self) -> None:
        r = valid_record()
        r["contract"]["requirements"].append(copy.deepcopy(r["contract"]["requirements"][0]))
        self.reject(r, "duplicate requirement")

    def test_open_critical_defect_forbids_pass(self) -> None:
        r = valid_record()
        r["defects"] = [{
            "id": "D1",
            "requirement_id": "R1",
            "severity": "critical",
            "status": "open",
            "evidence": "click fails in screenshot state",
        }]
        self.reject(r, "incompatible with unresolved critical/major")

    def test_open_major_defect_forbids_pass(self) -> None:
        r = valid_record()
        r["defects"] = [{
            "id": "D1",
            "requirement_id": "R1",
            "severity": "major",
            "status": "open",
            "evidence": "bad focus layout",
        }]
        self.reject(r, "incompatible with unresolved critical/major")

    def test_wontfix_critical_or_major_defect_forbids_pass(self) -> None:
        for severity in ("critical", "major"):
            with self.subTest(severity=severity):
                r = valid_record()
                r["defects"] = [{
                    "id": "D1", "requirement_id": "R1", "severity": severity,
                    "status": "wontfix-with-reason",
                    "evidence": "the required behavior still fails",
                }]
                self.reject(r, "incompatible with unresolved critical/major")

    def test_wontfix_minor_defect_can_be_disclosed_with_pass(self) -> None:
        r = valid_record()
        r["defects"] = [{
            "id": "Dminor", "requirement_id": None, "severity": "minor",
            "status": "wontfix-with-reason",
            "evidence": "noncritical cosmetic discrepancy accepted with reason",
        }]
        self.assertEqual([], validate(r))

    def test_missing_critic_provenance_rejected(self) -> None:
        r = valid_record()
        r["critic"] = {"mode": "independent", "provenance": ""}
        self.reject(r, "critic.provenance")

    def test_blocker_requires_next_step(self) -> None:
        for verdict in (
            "PAUSED_RECOVERABLE",
            "NEEDS_WORK",
            "BLOCKED_PERMISSION",
            "BLOCKED_ENV",
            "PLATEAU_UNRESOLVED",
        ):
            with self.subTest(verdict=verdict):
                r = valid_record()
                r["verdict"] = verdict
                r["next_action"] = None
                self.reject(r, "next_action")

    def test_pending_may_have_zero_inspections(self) -> None:
        r = valid_record()
        r["verdict"] = "BLOCKED_ENV"
        r["next_action"] = "Use a real renderer and inspect at 1280x720"
        r["inspections"] = []
        self.assertEqual([], validate(r))

    def test_pass_with_next_step_rejected(self) -> None:
        r = valid_record()
        r["next_action"] = "run tests"
        self.reject(r, "next_action must be null")

    def test_unknown_verdict_rejected(self) -> None:
        r = valid_record()
        r["verdict"] = "SUPER_GREEN"
        self.reject(r, "verdict must be one of")

    def test_empty_input_rejected(self) -> None:
        self.assertIn("root must be a JSON object", validate([]))

    def test_adversarial_unhashable_types_do_not_crash(self) -> None:
        r = valid_record()
        r["artifact_type"] = []
        r["verdict"] = {}
        r["defects"] = [{
            "id": "D1",
            "requirement_id": ["R1"],
            "severity": [],
            "status": [],
            "evidence": "example",
        }]
        messages = validate(r)
        self.assertTrue(messages)

    def test_pass_with_conflicting_final_failure_rejected(self) -> None:
        r = valid_record()
        r["inspections"].append({
            "revision": "r2",
            "method": "mobile screenshot + click",
            "artifact_ref": "private/mobile-r2.png",
            "state": "observed",
            "conditions": {"viewport": "390x844"},
            "requirements_checked": ["R1"],
            "result": "fail",
        })
        self.reject(r, "has a failing or unrun inspection at final_revision")

    def test_pass_with_explicit_final_not_run_rejected(self) -> None:
        r = valid_record()
        r["inspections"].append({
            "revision": "r2",
            "method": "unavailable animation renderer",
            "artifact_ref": "not-captured",
            "state": "not_run",
            "conditions": {},
            "requirements_checked": ["R2"],
            "result": "inconclusive",
        })
        self.reject(r, "has a failing or unrun inspection at final_revision")

    def test_pass_with_no_critical_gates_rejected(self) -> None:
        r = valid_record()
        for item in r["contract"]["requirements"]:
            item["critical"] = False
        self.reject(r, "at least one critical observable requirement")

    def test_malformed_inspection_value_does_not_crash(self) -> None:
        r = valid_record()
        r["inspections"][0]["result"] = []
        r["inspections"][0]["requirements_checked"] = [[]]
        errs = validate(r)
        self.assertTrue(errs)
        self.assertTrue(any("result must be" in e for e in errs))
        self.assertTrue(any("unknown requirement" in e for e in errs))

    def test_cli_good_and_bad(self) -> None:
        validator = Path(__file__).with_name("validate_evidence.py")
        with tempfile.TemporaryDirectory() as tmp:
            record_file = Path(tmp) / "run.json"
            record_file.write_text(json.dumps(valid_record()), encoding="utf-8")
            good = subprocess.run(
                [sys.executable, str(validator), str(record_file)],
                capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, good.returncode, good.stderr)
            r = valid_record()
            r["inspections"] = []
            record_file.write_text(json.dumps(r), encoding="utf-8")
            bad = subprocess.run(
                [sys.executable, str(validator), str(record_file)],
                capture_output=True, text=True, check=False,
            )
            self.assertNotEqual(0, bad.returncode)
            self.assertIn("zero inspections", bad.stderr)


if __name__ == "__main__":
    unittest.main()
