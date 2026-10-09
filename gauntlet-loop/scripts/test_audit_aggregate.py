#!/usr/bin/env python3
"""Independent SQLite oracle and adversarial tests for optional JSON data audit."""
from __future__ import annotations

import copy
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from audit_aggregate import audit


def fixture():
    source = {"records": [
        {"id":"u01", "area":"alpha", "change":9},
        {"id":"u02", "area":"beta", "change":5},
        {"id":"u03", "area":"alpha", "change":-4},
        {"id":"u02", "area":"beta", "change":5},  # exact duplicate
        {"id":"u04", "area":"beta", "change":-2},
        {"id":"u05", "area":"alpha", "change":1},
    ]}
    report = {"schema_version":"1", "id_field":"id", "group_field":"area",
       "value_field":"change", "metrics":{"source_rows":6,"unique_events":5,
       "duplicate_rows":1,"negative_events":2,"net_total":9,
       "net_by_group":{"alpha":6,"beta":3}}}
    return source, report


class DataAuditTests(unittest.TestCase):
    def test_correct_report_passes(self):
        source, report = fixture()
        self.assertEqual("CHECKS_PASS_SOURCE_RECONCILED", audit(source, report)["verdict"])

    def test_false_internally_balanced_report_fails(self):
        source, report = fixture()
        report["metrics"].update(net_by_group={"alpha": 10, "beta": 10}, net_total=20)
        self.assertEqual(sum(report["metrics"]["net_by_group"].values()), report["metrics"]["net_total"])
        result = audit(source, report)
        self.assertEqual("CHECKS_FAIL", result["verdict"])
        self.assertEqual({"metrics.net_total", "metrics.net_by_group"}, {e["field"] for e in result["errors"]})

    def test_duplicate_changes_without_matching_id_is_rejected(self):
        source, report = fixture()
        source["records"][3]["change"] = 25
        self.assertEqual("BLOCKED_DATA", audit(source, report)["verdict"])

    def test_wrong_source_revision_is_a_mismatch(self):
        source, report = fixture()
        source["records"][0]["change"] += 1
        self.assertEqual("CHECKS_FAIL", audit(source, report)["verdict"])

    def test_missing_group_reported_is_detected(self):
        source, report = fixture()
        report["metrics"]["net_by_group"].pop("beta")
        self.assertEqual("CHECKS_FAIL", audit(source, report)["verdict"])

    def test_extra_fake_group_is_detected(self):
        source, report = fixture()
        report["metrics"]["net_by_group"]["fake"] = 0
        self.assertEqual("CHECKS_FAIL", audit(source, report)["verdict"])

    def test_negative_events_are_not_ignored(self):
        source, report = fixture()
        report["metrics"]["negative_events"] = 0
        self.assertIn("metrics.negative_events", [e["field"] for e in audit(source, report)["errors"]])

    def test_boolean_quantity_rejected_as_data_error(self):
        source, report = fixture()
        source["records"][0]["change"] = True
        self.assertEqual("BLOCKED_DATA", audit(source, report)["verdict"])

    def test_fractional_quantity_rejected_not_rounded(self):
        source, report = fixture()
        source["records"][0]["change"] = 2.5
        self.assertEqual("BLOCKED_DATA", audit(source, report)["verdict"])

    def test_missing_required_metric_is_contract_error(self):
        source, report = fixture()
        report["metrics"].pop("net_total")
        self.assertEqual("BLOCKED_DATA", audit(source, report)["verdict"])

    def test_unexpected_metric_not_silently_accepted(self):
        source, report = fixture()
        report["metrics"]["fake_profit"] = 1000
        self.assertEqual("BLOCKED_DATA", audit(source, report)["verdict"])

    def test_nonlist_records_are_rejected(self):
        source, report = fixture()
        source["records"] = None
        self.assertEqual("BLOCKED_DATA", audit(source, report)["verdict"])

    def test_independent_sqlite_ground_truth(self):
        source, report = fixture()
        conn = sqlite3.connect(":memory:")
        conn.execute("CREATE TABLE event (seq INTEGER PRIMARY KEY, uid TEXT, area TEXT, change INTEGER)")
        conn.executemany("INSERT INTO event(uid,area,change) VALUES (?,?,?)",[(r["id"],r["area"],r["change"]) for r in source["records"]])
        rows = conn.execute("SELECT area,SUM(change) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY uid ORDER BY seq) AS pick FROM event) WHERE pick=1 GROUP BY area ORDER BY area").fetchall()
        groups = dict(rows)
        self.assertEqual(groups, report["metrics"]["net_by_group"])
        self.assertEqual(sum(groups.values()),report["metrics"]["net_total"])
        self.assertEqual(audit(source,report)["expected"]["net_by_group"],groups)

    def test_cli_pass_fail_and_blocked(self):
        source, report = fixture()
        script = Path(__file__).with_name("audit_aggregate.py")
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);src=p/"source.json";out=p/"out.json";r=p/"report.json"
            src.write_text(json.dumps(source),encoding="utf-8")
            r.write_text(json.dumps(report),encoding="utf-8")
            valid = subprocess.run([sys.executable,str(script),"--source",str(src),"--report",str(r),"--out",str(out)],capture_output=True,text=True)
            self.assertEqual(0,valid.returncode,valid.stderr)
            self.assertEqual("CHECKS_PASS_SOURCE_RECONCILED", json.loads(out.read_text())["verdict"])
            report["metrics"]["net_total"] += 1
            r.write_text(json.dumps(report),encoding="utf-8")
            bad=subprocess.run([sys.executable,str(script),"--source",str(src),"--report",str(r),"--out",str(out)],capture_output=True,text=True)
            self.assertEqual(1,bad.returncode,bad.stderr)
            self.assertEqual("CHECKS_FAIL",json.loads(out.read_text())["verdict"])
            src.write_text("{bad json",encoding="utf-8")
            blocked=subprocess.run([sys.executable,str(script),"--source",str(src),"--report",str(r),"--out",str(out)],capture_output=True,text=True)
            self.assertEqual(2,blocked.returncode,blocked.stderr)
            self.assertEqual("BLOCKED_DATA",json.loads(out.read_text())["verdict"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
