# Mechanism Studio · Phase 3b: detached proof-index design

**Status: design proposal only; no executable proof-index writer, verifier, migration, schema cutover, release or merge.**

This document is stacked on [Phase 3a PR #35](https://github.com/AVANT-ICONIC/skills/pull/35). Phase 3a provides a read-only router delegating to both original legacy package verifiers. Its Node-only CI passed 122/122 tests and the five-fixture frozen PR #32 compiler comparison. Real films are not being rebuilt for this proposal.

## 1. Decision and boundary

Adopt a **detached, opt-in index of existing proof/evidence claims**, not a new preview manifest and not a new shared study IR.

- Existing `avant.mechanism-package/1` and `avant.rigid-scene-package/1` packages, including every existing file, hash, manifest and viewer, remain byte-identical.
- The sidecar lives **outside** the legacy package root. No automatic placement inside ZIPs, no extra manifest asset and no mutation of original evidence.
- Future read path: legacy verifier first → bind exact subject bytes → validate sidecar as *untrusted metadata* → evaluate a caller-selected assurance policy → emit a detached result. The current `verifyPortablePackage()` continues to work without a sidecar.
- No default conversion to `/2`. An unknown schema cannot be reinterpreted as a known one.
- A verified asset SHA-256 establishes **internal byte consistency**. It does not establish who produced the artifact, whether the filmed browser checks truly ran, the truth of external scientific references, or certified mechanics.

The central refusal: **a self-authored proof index is not an independent attestation**. An attacker who can rewrite package content, its manifest and its proof sidecar can make all three internally consistent. Phase 3b must never report such a package as externally authenticated.

## 2. Proposed sidecar wire contract (not yet implemented)

Working schema identifier: `avant.mechanism-proof-index/1`. This is a **proposal**, not an advertised supported input format.

### Subject identity

The subject binds to the raw, unmodified legacy `manifest.json` bytes:

| Field | Contract |
| --- | --- |
| `subject.sourceSchema` | Exact `avant.mechanism-package/1` or `avant.rigid-scene-package/1` |
| `subject.packageId` | Legacy `packageId` or `id` after legacy validation |
| `subject.manifestSha256` | SHA-256 of raw manifest bytes, not reserialized JSON |
| `subject.assetCount` | Exact count returned by the legacy verifier |
| `subject.releaseReady` | Literally `false` |

All four data assertions must match the **freshly rerun** legacy verifier. The manifest digest binds the exact listed asset paths, sizes and hashes; the legacy verifier must independently rehash the bytes in the actual directory. **Unlisted files are not certified**. A copied package with bit-identical contents has the same subject identity by design; anti-copy or anti-replay authenticity is out of scope without a trusted issuance authority.

### Evidence reference list

Only an explicit allowlist of existing, **manifest-listed regular assets** may be referenced. The index cannot fetch URLs, evaluate code, invoke a model, import plugins, read files outside the package or add new mandatory claims to a v1 package.

Each reference has:
- `id`: stable, unique, bounded identifier;
- `domain`: one of `package-integrity`, `model-consistency`, `render-reproducibility`, `source-provenance`, `physical-safety`, `host-isolation`;
- `assetPath`: exact path already present in the legacy asset table;
- `assetSha256`: must equal **both** manifest entry and freshly read file digest;
- `legacyCheckId`: optional, format-scoped value from a known `evidence/report.json` check; a referenced `PASS` string is a **reported** result, not independent re-execution;
- `assessment`: explicit `REPORTED`, `REPLAYED` or `NOT_EVALUATED`, with the evaluator and method recorded. `REPLAYED` requires the verifier actually to repeat the relevant mathematical/media gate, not simply rehash a historical report.

An index should list only assertions it can locate through reviewed, format-specific adapters. Do not create a universal JSON-pointer interpreter with arbitrary untrusted path or expression evaluation.

### Verification result has two separate dimensions

| Dimension | Possible result | Meaning |
| --- | --- | --- |
| Internal package consistency | `PASS` / `FAIL` | Existing legacy format-specific verifier re-ran |
| Proof-index binding | `BOUND` / `ABSENT` / `INVALID` | Manifest subject and referenced asset bytes match |
| Origin assurance | `UNATTESTED` / `ATTESTED` | `ATTESTED` **not implementable** in 3b without a separately trusted signature/issuer validation scheme |
| Physical/mechanical certification | `NOT_EVALUATED` | No collision/load/fabrication certification exists in current preview packages |
| Host GPU and OS sandbox | `NOT_EVALUATED` | Browser/SwiftShader tests are not hardware or isolation certification |

No single `verified: true` aggregate may imply more than the actually checked dimension. In particular, an index field saying `ATTESTED` must never be accepted merely because it appears in JSON.

### Illustrative shape (not a usable attestation)

```json
{
  "schema": "avant.mechanism-proof-index/1",
  "subject": {
    "sourceSchema": "avant.rigid-scene-package/1",
    "packageId": "dual-drive-linkage-study-004",
    "manifestSha256": "<64 lowercase hexadecimal characters>",
    "assetCount": 11,
    "releaseReady": false
  },
  "references": [
    {
      "id": "render-film-report",
      "domain": "render-reproducibility",
      "assetPath": "evidence/report.json",
      "assetSha256": "<sha256 of the manifest-listed report asset>",
      "legacyCheckId": "real-full-film",
      "assessment": "REPORTED"
    }
  ],
  "originAssurance": "UNATTESTED",
  "physicalCertification": "NOT_EVALUATED",
  "hostIsolation": "NOT_EVALUATED"
}
```

Placeholders above are illustrative. An actual writer must replace them with measured bytes and reject malformed, missing, duplicate or unrecognized fields. Use deterministic key order for the index writer if desired, but **never** rely on reserialized JSON to match historical manifest hashes.

## 3. Threat model and mandatory negative cases

| Attack / failure | Required behavior | What cannot yet be proven |
| --- | --- | --- |
| Modified asset with old manifest/index | Legacy hash and binding fail | None of the altered bytes are trusted |
| Changed manifest, unchanged index | Exact manifest digest mismatch → `INVALID` | None |
| Foreign or stale evidence from another artifact | Manifest-listed asset/hash, package ID and source schema mismatch → reject | Attackers who can rewrite all sources remain untrusted |
| Rewrite assets + manifest + index consistently | May pass **internal integrity only**; origin remains `UNATTESTED` | Authentic maker, trusted CI origin, actual past render |
| Missing index when optional | Preserve legacy verification result; index = `ABSENT`, no silent assurance elevation | Provenance |
| Missing index when caller explicitly requires it | Fail required-index policy; never fall back silently | Authenticated origin |
| Unknown index `/2`, wrong source schema or duplicate IDs | Reject exactly, with no downgrade or parser guessing | Future format compatibility |
| Path traversal, absolute path, symlink, nested symlink, oversized JSON | Reject before opening evidence; bounded processing | OS sandbox and race-free hostile filesystem access |
| Replay identical index onto byte-identical copy | Bind as the **same content identity**, not a new certified run | Freshness, uniqueness, publisher identity |
| Forged GitHub Actions URL, run ID, timestamp or claim of signature | Treat as **untrusted annotations** unless verified against an explicit trust policy | Source authenticity |
| Evidence says `PASS` for external source or physics | Remain `NOT_EVALUATED` unless actually independently checked | Scientific accuracy, forces, collisions |
| Index injected into legacy output directory | Legacy golden byte/tree comparison must detect it | New schema migration |

Untrusted local data must not be allowed to upgrade `releaseReady=false`. For a mutable/racing filesystem, path inspection alone is not a process-level sandbox; if hostile concurrent mutation must be supported, use descriptor-based reads and a stronger isolation boundary in a later separately tested implementation.

## 4. Policy API for a future separate implementation

Proposed API behavior, not exported today:

```js
verifyWithProofIndex({
  packageDirectory,
  indexFile,                  // detached path, never implicit execution
  policy: 'legacy-only'       // or 'require-index-consistency'
})
```

- `legacy-only`: call existing `verifyPortablePackage()`, preserving current behavior; ignore index entirely.
- `require-index-consistency`: require *both* legacy validation and matching sidecar. Return `UNATTESTED` for provenance even on success.
- `require-trusted-origin`: **not available**, must fail closed instead of pretending SHA-256 plus a producer string is a signature.
- No credential, network, extension or external browser access is permitted for local consistency checking.

A future provenance feature may verify a cryptographic signature over a domain-separated subject digest and a trusted CI-run identity, with issuer trust roots, key rotation/revocation, repository/workflow binding and offline verification defined in **its own** change. It is not part of Phase 3b. Do not trust a self-declared issuer or a copied `signature` string.

## 5. Acceptance and migration plan

**Design review gate for 3b:**
1. Explicitly compare both legacy formats and their known proof-bearing assets. A detached sidecar must not demand that the rigid-scene and reviewed-recipe reports have the same shape.
2. Review the exact subject-binding algorithm and minimal sidecar schema. Reject unsupported assurance levels.
3. Tabletop-test all threats in §3, especially *manifest + assets + index rehash* and same-bytes replay. Document what remains impossible to establish offline.
4. Preserve `releaseReady=false`, technical-reference links as unfetched, unknown physical certification, and host isolation as not evaluated.

**If implementation is separately approved later:**
1. Add a strict read-only index decoder with no legacy verifier changes.
2. Add fixture tests for both schemas, hostile paths, size limits, malformed/duplicate fields, copied packages, wrong evidence and downgrade attempts.
3. Run cheap Node tests and frozen five-fixture golden parity. Compare available Phase 2 archived package payload digests rather than rerendering films.
4. Add full browser/film CI only if an actual renderer, package writer or film semantics change, not merely to exercise a detached metadata reader.
5. Keep old packages and the Phase 3a CLI usable without the sidecar. Never automatically rewrite existing preview packages.

**Rollback:** discard only the detached index (and future reader). Original package formats, verification CLI, generated files, shaders, solvers and films remain untouched.

## 6. Deferred decisions (explicitly out of this design PR)

- **v2 package manifests:** separate proposal with bidirectional migration readers, frozen legacy fixtures and no forced cutover.
- **Typed study IR:** separate architecture phase after proof-index reader, with explicit units, topology, kinematic branch semantics and output-byte migration gates.
- **Signed provenance and release trust:** separate threat-reviewed implementation with trusted keys/issuers, not a claim inferred from SHA-256.
- **Scientific/physical certification:** external evidence and independent mechanical analysis, not available from present generated videos.
