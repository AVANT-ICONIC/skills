#!/usr/bin/env python3
"""Executable negative controls for the receipt validator, no third-party packages."""
from __future__ import annotations

import copy
import unittest

from validate_receipt import inspect


def good():
    return {
        "schema": "anti-sloprush-receipt/v1",
        "artifact": {"id": "a.png", "revision": "r2", "kind": "image"},
        "review_provenance": "single-agent",
        "observations": [{"id": "e1", "revision": "r2", "method": "opened-image", "ref": "local.png"}],
        "critical_gates": [{"id": "identity", "status": "PASS", "evidence_ids": ["e1"]}],
        "craft": {"status": "PASS", "evidence_ids": ["e1"]},
        "regressions": {"status": "PASS", "evidence_ids": ["e1"]},
        "defects": [],
        "verdict": "PASS",
    }


def locked_contract():
    return {
        "schema": "anti-sloprush-contract/v1",
        "artifact_id": "a.png",
        "critical_gate_ids": ["identity"],
    }


class ReceiptTests(unittest.TestCase):
    def test_locked_contract_matches(self):
        self.assertEqual(inspect(good(), locked_contract()), [])

    def test_dropped_hard_gate_rejected_against_contract(self):
        x = good()
        contract = locked_contract()
        contract["critical_gate_ids"].append("identity-right")
        self.assertIn("do not match locked contract", " ".join(inspect(x, contract)))

    def test_forged_replacement_gate_rejected(self):
        x = good()
        x["critical_gates"][0]["id"] = "generic-quality"
        self.assertTrue(inspect(x, locked_contract()))

    def test_wrong_artifact_rejected(self):
        x = good()
        x["artifact"]["id"] = "different.png"
        self.assertTrue(inspect(x, locked_contract()))

    def test_valid_latest_artifact_pass(self):
        self.assertEqual(inspect(good()), [])

    def test_changed_candidate_invalidates_review(self):
        x = good()
        x["artifact"]["revision"] = "r3"
        self.assertIn("stale", " ".join(inspect(x)))

    def test_missing_observation_rejected(self):
        x = good()
        x["observations"] = []
        self.assertTrue(inspect(x))

    def test_wrong_fighter_blocks_even_with_polish_pass(self):
        x = good()
        x["critical_gates"][0]["status"] = "FAIL"
        self.assertIn("all critical gates", " ".join(inspect(x)))

    def test_not_evaluated_blocks_pass(self):
        x = good()
        x["critical_gates"][0]["status"] = "NOT_EVALUATED"
        self.assertTrue(inspect(x))

    def test_new_version_faked_by_stale_gate_ref(self):
        x = good()
        x["observations"].append({"id":"e2","revision":"r1","method":"opened-image","ref":"old.png"})
        x["critical_gates"][0]["evidence_ids"] = ["e2"]
        self.assertIn("stale", " ".join(inspect(x)))

    def test_no_critical_gate_rejected(self):
        x = good()
        x["critical_gates"] = []
        self.assertTrue(inspect(x))

    def test_open_material_defect_rejected(self):
        x = good()
        x["defects"] = [{"severity":"material","status":"open"}]
        self.assertTrue(inspect(x))

    def test_deferred_material_defect_rejected(self):
        x = good()
        x["defects"] = [{"severity":"material","status":"deferred"}]
        self.assertTrue(inspect(x))

    def test_minor_open_allowed_when_reviewed(self):
        x = good()
        x["defects"] = [{"severity":"minor","status":"open"}]
        self.assertEqual(inspect(x), [])

    def test_stale_craft_rejected(self):
        x = good()
        x["observations"].append({"id":"old","revision":"r1","method":"opened-image","ref":"old.png"})
        x["craft"]["evidence_ids"] = ["old"]
        self.assertTrue(inspect(x))

    def test_missing_regression_rejected(self):
        x = good()
        x["regressions"]["evidence_ids"] = []
        self.assertTrue(inspect(x))

    def test_dangling_evidence_id_rejected(self):
        x = good()
        x["critical_gates"][0]["evidence_ids"] = ["invented"]
        self.assertTrue(inspect(x))

    def test_duplicate_gate_rejected(self):
        x = good()
        x["critical_gates"].append(copy.deepcopy(x["critical_gates"][0]))
        self.assertTrue(inspect(x))

    def test_incomplete_state_is_valid_but_not_pass(self):
        x = good()
        x["verdict"] = "NEEDS_WORK"
        x["critical_gates"][0]["status"] = "FAIL"
        self.assertEqual(inspect(x), [])

    def test_no_fake_independent_review_label(self):
        x = good()
        x["review_provenance"] = "three internal agents"
        self.assertTrue(inspect(x))

    def test_unsupported_method_rejected(self):
        x = good()
        x["observations"][0]["method"] = "imagined-image"
        self.assertTrue(inspect(x))

    def test_non_object_rejected(self):
        self.assertTrue(inspect([]))


if __name__ == "__main__":
    unittest.main()
