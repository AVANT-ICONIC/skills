#!/usr/bin/env python3
"""Deterministically stage the portable Game Studio creative core for a future adapter.

Only *listed* source files are copied. S3 does not install or modify a WebUI skill.
Requires Python 3 stdlib; no Git checkout, network, credentials or paid service.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
import sys

SCHEMA = 1
GENERATOR = "1.0.0"
# Stable explicit allowlist. No glob discovery and no arbitrary source paths.
FILES = (
    "coverage.json",
    "framing.md",
    "mechanism-synthesis.md",
    "player-interaction.md",
    "systems-and-economy.md",
    "progression-and-variation.md",
    "experience-and-game-feel.md",
    "pitch-market-and-scope.md",
    "reality-check-and-playtest.md",
    "existing-game-rescue.md",
)
MANIFEST = "package-manifest.json"
SOURCE = Path(__file__).resolve().parent.parent / "references" / "concept-core"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_contents(source: Path) -> dict[str, bytes]:
    if not source.is_dir():
        raise ValueError("canonical concept-core directory is missing")
    result = {}
    for name in FILES:
        path = source / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"unsafe or missing source module: {name}")
        result[name] = path.read_bytes()
    return result


def manifest_for(payload: dict[str, bytes], source_revision: str | None = None) -> bytes:
    """Deterministic map of *source* modules to generated WebUI-ready snapshot paths.

    Revision is optional for installed folders without Git metadata. Callers packaging
    from a known Git commit should pass its exact SHA to bind package provenance.
    """
    if source_revision is not None and not re.fullmatch(r"[0-9a-f]{40}", source_revision):
        raise ValueError("source_revision must be a full 40-character lowercase Git SHA")
    structure = {
        "schema_version": SCHEMA,
        "generator_version": GENERATOR,
        "source_root": "game-studio/references/concept-core",
        "source_revision": source_revision,
        "files": [
            {"source_path": f"game-studio/references/concept-core/{name}",
             "generated_path": name, "sha256": digest(payload[name]), "bytes": len(payload[name])}
            for name in FILES
        ],
    }
    return (json.dumps(structure, sort_keys=True, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def package(source: Path, output: Path, *, check: bool = False, source_revision: str | None = None) -> tuple[bool, list[str]]:
    """Stage a self-contained snapshot, or detect *all* known drift in check mode."""
    payload = source_contents(source)
    expected = {**payload, MANIFEST: manifest_for(payload, source_revision)}
    if output.resolve() == source.resolve() or source.resolve() in output.resolve().parents:
        raise ValueError("output must not overwrite the canonical core or nest inside it")
    if output.exists() and output.is_symlink():
        raise ValueError("refusing symlink destination")
    existing = {p.name for p in output.iterdir()} if output.is_dir() else set()
    # A snapshot directory must contain exactly the allowlisted entries, no unknown files.
    discrepancies = [f"unexpected: {name}" for name in sorted(existing - set(expected))]
    for name, data in expected.items():
        path = output / name
        if path.is_symlink():
            discrepancies.append(f"symlink: {name}")
        elif not path.is_file():
            discrepancies.append(f"missing: {name}")
        elif path.read_bytes() != data:
            discrepancies.append(f"changed: {name}")
    if check:
        return not discrepancies, discrepancies
    if output.exists() and not output.is_dir():
        raise ValueError("output must be a directory")
    if existing - set(expected):
        raise ValueError("output has unrelated files; refuse destructive cleanup: " + ", ".join(sorted(existing-set(expected))))
    # Fail without touching any file when one existing destination is unsafe.
    if any((output / name).is_symlink() for name in expected):
        raise ValueError("refusing symlink destination file")
    output.mkdir(parents=True, exist_ok=True)
    for name, data in expected.items():
        path = output / name
        if path.exists() and path.is_symlink():
            raise ValueError(f"refusing to write to symlink: {name}")
        path.write_bytes(data)
    return True, []


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path, help="Separate output dir for future adapter snapshot")
    parser.add_argument("--check", action="store_true", help="Read-only match check, fail closed on drift")
    parser.add_argument("--source-revision", metavar="SHA", help="Optional exact 40-char source commit for manifest provenance; use same value when checking")
    args = parser.parse_args(argv)
    try:
        ok, issues = package(SOURCE, args.out, check=args.check, source_revision=args.source_revision)
    except (OSError, ValueError) as exc:
        print(f"PACKAGE_ERROR: {exc}", file=sys.stderr)
        return 2
    if not ok:
        print("DRIFT_DETECTED\n" + "\n".join(issues), file=sys.stderr)
        return 1
    print(("MATCH" if args.check else "STAGED") + f" ({len(FILES)} allowlisted files, SHA-256 manifest)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
