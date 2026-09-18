#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("change-metrics.py")


def run(*args: str, cwd: Path, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [*args],
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=check,
    )


class ChangeMetricsTests(unittest.TestCase):
    def make_repo(self) -> tuple[tempfile.TemporaryDirectory[str], Path, str]:
        temp = tempfile.TemporaryDirectory()
        repo = Path(temp.name)
        run("git", "init", "-q", cwd=repo)
        run("git", "config", "user.email", "futurequake@example.invalid", cwd=repo)
        run("git", "config", "user.name", "Futurequake Test", cwd=repo)
        (repo / "src").mkdir()
        (repo / "tests").mkdir()
        (repo / "src" / "app.py").write_text('print("baseline")\n')
        (repo / "tests" / "test_app.py").write_text("def test_ok():\n    assert True\n")
        run("git", "add", ".", cwd=repo)
        run("git", "commit", "-qm", "baseline", cwd=repo)
        base = run("git", "rev-parse", "HEAD", cwd=repo).stdout.strip()
        return temp, repo, base

    def collect(self, repo: Path, base: str) -> dict[str, object]:
        proc = run(
            sys.executable,
            str(SCRIPT),
            "--repo",
            str(repo),
            "--base",
            base,
            "--json",
            cwd=repo,
        )
        return json.loads(proc.stdout)

    def test_counts_tracked_and_untracked_worktree_changes(self) -> None:
        temp, repo, base = self.make_repo()
        self.addCleanup(temp.cleanup)

        with (repo / "src" / "app.py").open("a") as handle:
            handle.write('print("future")\n')
        (repo / "package.json").write_text('{"name":"quake"}\n')
        with (repo / "tests" / "test_app.py").open("a") as handle:
            handle.write("def test_future():\n    assert True\n")

        result = self.collect(repo, base)

        self.assertEqual(result["files_touched"], 3)
        self.assertEqual(result["test_files_touched"], 1)
        self.assertEqual(result["config_files_touched"], 1)
        self.assertEqual(result["untracked_files"], 1)
        self.assertEqual(result["top_level_areas"], {"<root>": 1, "src": 1, "tests": 1})
        self.assertEqual(result["status_counts"], {"??": 1, "M": 2})

    def test_counts_committed_changes_since_baseline(self) -> None:
        temp, repo, base = self.make_repo()
        self.addCleanup(temp.cleanup)

        (repo / "src" / "feature.py").write_text("VALUE = 1\n")
        run("git", "add", ".", cwd=repo)
        run("git", "commit", "-qm", "future change", cwd=repo)

        result = self.collect(repo, base)

        self.assertEqual(result["files_touched"], 1)
        self.assertEqual(result["untracked_files"], 0)
        self.assertEqual(result["status_counts"], {"A": 1})
        self.assertNotEqual(result["head"], result["base"])

    def test_invalid_base_fails_without_traceback(self) -> None:
        temp, repo, _ = self.make_repo()
        self.addCleanup(temp.cleanup)

        proc = run(
            sys.executable,
            str(SCRIPT),
            "--repo",
            str(repo),
            "--base",
            "definitely-not-a-ref",
            cwd=repo,
            check=False,
        )

        self.assertEqual(proc.returncode, 2)
        self.assertIn("error:", proc.stderr)
        self.assertNotIn("Traceback", proc.stderr)


if __name__ == "__main__":
    unittest.main()
