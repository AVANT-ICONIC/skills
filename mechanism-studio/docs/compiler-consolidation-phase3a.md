# Mechanism Studio compiler consolidation: Phase 3a, read-only package dispatch

**Status:** additive implementation on a separate draft branch stacked on Phase 2 (PR #34).
**Not** a manifest migration, common IR migration, re-render, release promotion or merge.

## Decision

Keep the two historic packages and their existing verifiers authoritative:

| Existing manifest | Existing verifier | New route |
| --- | --- | --- |
| `avant.mechanism-package/1` | `scripts/package-example.mjs::verifyPackage` | `scripts/verify-portable.mjs` |
| `avant.rigid-scene-package/1` | `rigid-scene/package-scene.mjs::verifyScenePackage` | `scripts/verify-portable.mjs` |

The new CLI reads the manifest, accepts **only** those exact schema identifiers, checks a bounded regular manifest and rejects symlinked roots, manifests, directories or assets. It loads only the format-specific verifier it needs and delegates the actual proof, manifest fields, source claims and SHA-256 checks to that unchanged verifier. It returns one **verification receipt** (`avant.mechanism-package-verification/1`) with the original source schema, package ID, tier, verified asset count, PASS and `releaseReady=false`. This receipt is printed; it is **not** written into the package. The original `scripts/verify.mjs` command is not modified.

```sh
node mechanism-studio/scripts/verify-portable.mjs /absolute/path/to/preview-package
node --test mechanism-studio/compatibility/phase3-package-reader.test.mjs
```

## Non-regression contract

1. Both existing manifest schemas, frozen PR #32 five-fixture compiler output bytes and Phase 2 renderer remain untouched. Never rewrite or auto-upgrade existing packages.
2. Both format-specific verifier functions are unchanged. They must reject forged proofs, unreviewed source, missing evidence, mismatched hashes and release promotion exactly as before.
3. A new schema suffix such as `/2` is rejected, not guessed or silently downgraded. Never choose a parser from a filename, `tier` or package contents alone.
4. Test each legacy family with synthetic, fully hash-consistent local fixtures, then deliberate tampering; prove the router did not write or alter any file. Such synthetic media bytes test routing and integrity, **not actual film playback or mechanical accuracy**.
5. Preserve the Phase 2 actual video/Chromium evidence. Do not spend fresh film CI minutes for a read-only CLI addition. Full repo, golden fixture and real artifact checks remain required before merge.

## Separate follow-on decisions

**Phase 3b, if needed:** Define an independent, opt-in proof-index / migration reader with replay attack, downgrade, stale evidence and signature-trust threats explicitly evaluated; no manifest v2 writer until both legacy readers and real archived packages pass. A digest stored beside files is **not** a signature, and package asset hashes alone do not establish origin.

**Phase 4, later:** Design a typed study IR with a clearly scoped converter for the three reviewed-recipe backends and two generic topologies. Gate semantics, degrees of freedom, units, branch behavior and video frame reproducibility before changing compilation. Keep this entirely separate from the package-reader review.

**Rollback:** delete the new router, tests and this document. Both old CLIs and all persisted packages work unchanged.

**Limits:** preview `releaseReady=false`; no independent physics, source-document attestation, browser host sandbox, device GPU certification or code-signing claims.
