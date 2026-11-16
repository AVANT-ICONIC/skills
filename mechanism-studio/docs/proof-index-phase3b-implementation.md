# Mechanism Studio · Phase 3b read-only proof-index validator

**Implementation:** additive, optional, stacked on the [separate Phase 3b design proposal](proof-index-phase3b-design.md). Do not merge automatically. The Phase 3a router, both original legacy manifest/verification schemas, package writers, compilers, renderer and preview output bytes are untouched.

## What actually changes

`scripts/verify-proof-index.mjs` is a new read-only entrypoint:

```sh
node mechanism-studio/scripts/verify-proof-index.mjs legacy-only /path/to/legacy-package
node mechanism-studio/scripts/verify-proof-index.mjs require-index-consistency \
  /path/to/legacy-package /separate/location/proof-index.json
```

The first mode calls the existing `verifyPortablePackage()` and deliberately ignores sidecars. The second mode repeats legacy verification, then binds a **detached** `avant.mechanism-proof-index/1` JSON sidecar to the exact raw manifest bytes, legacy schema, package ID, verified asset count, and existing manifest-listed SHA-256 evidence. The sidecar has a 64 KiB maximum and no support for executable expressions, injected external URLs, extra claims, unknown versions or self-declared signatures.

A successful sidecar check produces `avant.mechanism-proof-index-result/1` with separate dimensions:

- `package`: the existing legacy verification receipt;
- `indexBinding: "BOUND"`: raw manifest and referenced evidence hashes match;
- `originAssurance: "UNATTESTED"`: no trusted publisher/signature validation was attempted;
- `physicalCertification: "NOT_EVALUATED"`;
- `hostIsolation: "NOT_EVALUATED"`;
- `releaseReady: false`.

No `ATTESTED` or `REPLAYED` claim is accepted; the `require-trusted-origin` policy explicitly rejects because issuer/key verification is not implemented.

## Evidence semantics

`REPORTED` references require an exact existing, legacy-manifest-listed report file, a known format-specific check ID assigned to the declared proof domain, and an existing `PASS` entry in the report. For example, a film-capture check cannot be relabeled physical safety, and browser boot cannot be mislabeled model consistency. The checks are still **historically reported**, not rerun by this validator.

`NOT_EVALUATED` references cannot cite a positive legacy check. References to physical safety or host isolation cannot claim `REPORTED` or `REPLAYED`.

The decoder rejects duplicate JSON properties, duplicate reference IDs, foreign/stale manifest hashes, unknown fields, unknown source schemas, extra signatures, symlinked index ancestors or asset files, index paths inside the package, path traversal (via the unchanged Phase 3a verifier) and oversized index files.

**Limit:** File-type and symlink checks are not a race-free hostile-filesystem sandbox. A completely forged package+manifest+index can still pass internal consistency if its evidence is self-consistently rehashed; this explicitly does **not** establish origin or reproduce the underlying simulation.

## Verification

Run the cheap standalone gates:

```sh
node --test mechanism-studio/compatibility/phase3b-proof-index.test.mjs
node --test mechanism-studio/compatibility/*.test.mjs \
  mechanism-studio/rigid-scene/*.test.mjs \
  mechanism-studio/tests/*.test.mjs \
  mechanism-studio/examples/slider-crank/model.test.mjs \
  mechanism-studio/examples/geneva-indexer/model.test.mjs
node mechanism-studio/compatibility/compiler-parity.mjs --baseline-dir /path/to/frozen-PR32
```

GitHub Actions workflow `.github/workflows/mechanism-studio-proof-index.yml` runs the complete Node-only suite and frozen five-fixture byte comparison without installing or capturing Chromium/FFmpeg films. Existing package/renderer/legacy-verifier files are also asserted Git-diff identical to the design branch.

Separately, previously generated Phase-2 CI artifacts were retrieved and inspected *without rerendering*: two generic rigid-scene packages (11 assets each) and one reviewed slider-crank package (12 assets) had **34/34 manifest-listed asset byte hashes matching SHA-256**, no unlisted ZIP payload files, and `releaseReady=false`. This is an independent archive-integrity check, not a claim the new JS sidecar reader was run against those archived artifacts. All new runtime proof-index tests use local synthetic content with authentic legacy manifest structures; those payloads are **not** evidence of media decoding or real mechanical physics.

**Rollback:** drop the new `verify-proof-index.mjs`, its tests, this document and the cheap CI workflow. The Phase 3a and original legacy package verifiers continue to work unchanged.

**Deferred:** signed provenance, trust roots/revocation, separate `/2` manifest reader/writer, typed study IR, physical certification.
