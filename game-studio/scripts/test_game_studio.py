"""Portable stdlib checks: completeness/provenance metadata and package tamper detection.

These tests validate deterministic instructions/packaging only. They do not simulate
an independent coding agent or prove concepts are fun. Creative trials are separately
assessed in the private evaluation report.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
CORE = ROOT / "references" / "concept-core"
SCRIPT = ROOT / "scripts" / "package_concept_core.py"
spec = importlib.util.spec_from_file_location("package_concept_core", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
EXPECTED = {
    "D00": "framing.md", "D01": "framing.md", "D02": "framing.md",
    "D03": "experience-and-game-feel.md", "D04": "player-interaction.md",
    "D05": "pitch-market-and-scope.md", "D06": "pitch-market-and-scope.md",
    "D07": "mechanism-synthesis.md", "D08": "mechanism-synthesis.md",
    "D09": "mechanism-synthesis.md", "D10": "systems-and-economy.md",
    "D11": "mechanism-synthesis.md", "D12": "experience-and-game-feel.md",
    "D13": "progression-and-variation.md", "D14": "progression-and-variation.md",
    "D15": "reality-check-and-playtest.md", "D16": "reality-check-and-playtest.md",
    "D17": "reality-check-and-playtest.md", "D18": "player-interaction.md",
    "D19": "existing-game-rescue.md", "D20": "framing.md",
    "D21": "existing-game-rescue.md",
}

class Coverage(unittest.TestCase):
    def test_metadata_22_ids_exact(self):
        contents = json.loads((CORE / "coverage.json").read_text())
        self.assertEqual({f"D{i:02d}" for i in range(22)}, {item["id"] for item in contents["baseline_disciplines"]})
        self.assertEqual(len(contents["baseline_disciplines"]), 22)

    def test_mapping_known_against_external_contract(self):
        got = {x["id"]: x["owner"].rsplit("/", 1)[-1]
               for x in json.loads((CORE / "coverage.json").read_text())["baseline_disciplines"]}
        self.assertEqual(EXPECTED, got)

    def test_disciplines_have_substantive_instruction_and_countercheck(self):
        for identifier, name in EXPECTED.items():
            with self.subTest(identifier=identifier):
                text = (CORE / name).read_text()
                found = re.search(rf"^## {identifier}: .+?$(.*?)(?=^## |\Z)", text, flags=re.M|re.S)
                self.assertIsNotNone(found, f"missing independent section for {identifier}")
                section = found.group(1).strip()
                self.assertGreater(len(section), 230)
                self.assertRegex(section.lower(), r"(test|probe|check|acceptance|falsif|counter)")
                self.assertRegex(section.lower(), r"(choice|action|state|player|game|input|system)")

    def test_no_automatic_implementation_for_concepts(self):
        main = (ROOT / "SKILL.md").read_text().lower()
        self.assertIn("concept-only requests never authorize code changes", main)
        self.assertIn("three independently viable", main)
        self.assertIn("no writes", main)
        self.assertIn("rescue", main)
        self.assertIn("first 60 seconds", main)

    def test_no_control_chars_in_public_source(self):
        for p in ROOT.rglob("*"):
            if p.is_file() and p.suffix in (".md", ".py", ".json"):
                self.assertFalse([c for c in p.read_text() if ord(c) < 32 and c not in "\n\r\t"], p)

    def test_no_private_project_terms_in_public_skill(self):
        needle = ("cosmic" + "-office", "agent" + "-workbench", "game" + "-skills-v1")
        for p in ROOT.rglob("*"):
            if p.is_file() and p.suffix in (".md", ".py", ".json"):
                text = p.read_text().lower()
                for term in needle:
                    self.assertNotIn(term, text, p)

class Packaging(unittest.TestCase):
    def test_identical_manifest_across_runs(self):
        payload = mod.source_contents(CORE)
        self.assertEqual(mod.manifest_for(payload), mod.manifest_for(mod.source_contents(CORE)))

    def test_snapshot_self_contained_and_checked(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/"output"
            self.assertTrue(mod.package(CORE, out)[0])
            self.assertTrue(mod.package(CORE, out, check=True)[0])
            self.assertEqual({*mod.FILES, mod.MANIFEST}, {x.name for x in out.iterdir()})
            data = json.loads((out/mod.MANIFEST).read_text())
            self.assertEqual(mod.SCHEMA, data["schema_version"])
            self.assertEqual(list(mod.FILES), [row["path"] for row in data["files"]])

    def test_modified_file_is_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/"out"
            mod.package(CORE, out)
            (out/"framing.md").write_text("tampered")
            ok, issues = mod.package(CORE, out, check=True)
            self.assertFalse(ok)
            self.assertIn("changed: framing.md", issues)

    def test_manifest_tampering_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/"out"
            mod.package(CORE, out)
            (out/mod.MANIFEST).write_text("{}")
            ok, issues = mod.package(CORE, out, check=True)
            self.assertFalse(ok)
            self.assertIn("changed: package-manifest.json", issues)

    def test_unexpected_file_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/"out"
            mod.package(CORE, out)
            (out/"private.txt").write_text("do not copy")
            ok, issues = mod.package(CORE, out, check=True)
            self.assertFalse(ok)
            self.assertIn("unexpected: private.txt", issues)
            with self.assertRaisesRegex(ValueError, "unrelated files"):
                mod.package(CORE, out)

    def test_missing_file_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/"out"
            mod.package(CORE, out)
            (out/"player-interaction.md").unlink()
            ok, issues = mod.package(CORE, out, check=True)
            self.assertFalse(ok)
            self.assertIn("missing: player-interaction.md", issues)

    def test_symlink_source_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)/"source"
            source.mkdir()
            for name in mod.FILES:
                (source/name).write_bytes((CORE/name).read_bytes())
            (source/"framing.md").unlink()
            (source/"framing.md").symlink_to(CORE/"framing.md")
            with self.assertRaisesRegex(ValueError, "unsafe or missing"):
                mod.source_contents(source)

    def test_destination_symlink_fails_without_partial_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out"
            mod.package(CORE, out)
            victim = Path(tmp) / "target.txt"
            victim.write_text("untouched")
            (out / "existing-game-rescue.md").unlink()
            (out / "existing-game-rescue.md").symlink_to(victim)
            (out / "framing.md").write_text("do not modify yet")
            with self.assertRaisesRegex(ValueError, "symlink destination"):
                mod.package(CORE, out)
            self.assertEqual((out / "framing.md").read_text(), "do not modify yet")
            self.assertEqual(victim.read_text(), "untouched")

    def test_source_directory_cannot_be_overwritten(self):
        with self.assertRaisesRegex(ValueError, "must not overwrite"):
            mod.package(CORE, CORE)

    def test_nested_destination_source_protected(self):
        with self.assertRaisesRegex(ValueError, "must not overwrite"):
            mod.package(CORE, CORE/"target")

    def test_rogue_manifest_entry_not_created(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/"output"
            mod.package(CORE, out)
            self.assertFalse(any(x.name.startswith(".") for x in out.iterdir()))
            self.assertFalse((out/"SKILL.md").exists())

if __name__ == "__main__":
    unittest.main()
