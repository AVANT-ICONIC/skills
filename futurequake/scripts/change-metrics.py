#!/usr/bin/env python3
"""Collect deterministic git-diff metrics for a Futurequake experiment.

This intentionally reports facts, not an architecture score.
Uses Python stdlib only.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from collections import Counter
from pathlib import Path


TEST_MARKERS = (
    "/test/",
    "/tests/",
    "/__tests__/",
    ".test.",
    ".spec.",
    "_test.",
)

CONFIG_NAMES = {
    "package.json",
    "pyproject.toml",
    "cargo.toml",
    "go.mod",
    "go.sum",
    "composer.json",
    "composer.lock",
    "requirements.txt",
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
}

SCHEMA_MARKERS = (
    "migration",
    "migrations",
    "schema",
    "prisma",
)


def run_git(repo: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git command failed")
    return proc.stdout


def classify_file(path: str) -> dict[str, bool]:
    normalized = "/" + path.replace("\\", "/").lower()
    basename = os.path.basename(normalized)
    return {
        "test": any(marker in normalized for marker in TEST_MARKERS),
        "config": basename in CONFIG_NAMES
        or basename.endswith((".config.js", ".config.ts", ".config.mjs", ".config.cjs")),
        "schema_or_migration": any(marker in normalized for marker in SCHEMA_MARKERS),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Collect objective git-diff metrics for a Futurequake worktree."
    )
    parser.add_argument("--repo", default=".", help="Path to the quake worktree")
    parser.add_argument(
        "--base",
        required=True,
        help="Baseline ref/commit to diff against (for example the baseline SHA)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit compact JSON instead of pretty JSON",
    )
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    if not (repo / ".git").exists() and not (repo / ".git").is_file():
        # Worktrees commonly have a .git file. Bare/nonstandard repos still get a
        # second chance through git rev-parse below.
        pass

    try:
        top = Path(run_git(repo, "rev-parse", "--show-toplevel").strip())
        head = run_git(repo, "rev-parse", "HEAD").strip()
        base = run_git(repo, "rev-parse", args.base).strip()

        name_status = run_git(repo, "diff", "--name-status", base, "--")
        numstat = run_git(repo, "diff", "--numstat", base, "--")
        porcelain = run_git(repo, "status", "--porcelain")
        untracked_raw = run_git(repo, "ls-files", "--others", "--exclude-standard")
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    changed: list[dict[str, object]] = []
    status_by_path: dict[str, str] = {}

    for line in name_status.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        path = parts[-1]
        status_by_path[path] = status

    additions = 0
    deletions = 0
    binary_files = 0
    top_level = Counter()
    test_files = 0
    config_files = 0
    schema_files = 0

    for line in numstat.splitlines():
        if not line.strip():
            continue
        add_raw, del_raw, path = line.split("\t", 2)
        binary = add_raw == "-" or del_raw == "-"
        add = 0 if binary else int(add_raw)
        delete = 0 if binary else int(del_raw)
        additions += add
        deletions += delete
        binary_files += int(binary)

        flags = classify_file(path)
        test_files += int(flags["test"])
        config_files += int(flags["config"])
        schema_files += int(flags["schema_or_migration"])

        normalized_path = path.replace("\\", "/")
        first = normalized_path.split("/", 1)[0] if "/" in normalized_path else "<root>"
        top_level[first] += 1
        changed.append(
            {
                "path": path,
                "status": status_by_path.get(path, "M"),
                "additions": None if binary else add,
                "deletions": None if binary else delete,
                "binary": binary,
                "test": flags["test"],
                "config": flags["config"],
                "schema_or_migration": flags["schema_or_migration"],
            }
        )

    untracked = [line for line in untracked_raw.splitlines() if line.strip()]
    known_paths = {str(item["path"]) for item in changed}
    for path in untracked:
        if path in known_paths:
            continue
        flags = classify_file(path)
        test_files += int(flags["test"])
        config_files += int(flags["config"])
        schema_files += int(flags["schema_or_migration"])
        normalized_path = path.replace("\\", "/")
        first = normalized_path.split("/", 1)[0] if "/" in normalized_path else "<root>"
        top_level[first] += 1
        changed.append(
            {
                "path": path,
                "status": "??",
                "additions": None,
                "deletions": None,
                "binary": None,
                "test": flags["test"],
                "config": flags["config"],
                "schema_or_migration": flags["schema_or_migration"],
            }
        )

    changed.sort(key=lambda item: str(item["path"]))
    uncommitted = [line for line in porcelain.splitlines() if line.strip()]

    status_counts = Counter(str(item["status"]) for item in changed)

    result = {
        "repo": str(top),
        "base": base,
        "head": head,
        "files_touched": len(changed),
        "additions": additions,
        "deletions": deletions,
        "binary_files": binary_files,
        "test_files_touched": test_files,
        "config_files_touched": config_files,
        "schema_or_migration_files_touched": schema_files,
        "top_level_areas": dict(sorted(top_level.items())),
        "status_counts": dict(sorted(status_counts.items())),
        "untracked_files": len(untracked),
        "uncommitted_entries": len(uncommitted),
        "files": changed,
    }

    if args.json:
        print(json.dumps(result, separators=(",", ":"), sort_keys=True))
    else:
        print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
