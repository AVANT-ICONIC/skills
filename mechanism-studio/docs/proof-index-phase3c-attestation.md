# Mechanism Studio · Phase 3c · GitHub-signed archive audit

**Status:** experimental keyless signer verification on a separate draft branch. This attests that a particular GitHub Actions workflow reviewed three immutable archived package bytes. It **does not** retroactively certify which workflow created the three original films.

## Why not invent a signing-key subsystem?

GitHub's supported `actions/attest@v4` uses GitHub Actions OIDC identity, Sigstore and SLSA provenance. The `gh attestation verify` verifier checks the artifact's signed subject digest plus certificate identity and timestamp verification. This avoids embedding a hard-coded private key or trusting issuer names from JSON. See [GitHub's official instructions](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) and [CLI verifier contract](https://cli.github.com/manual/gh_attestation_verify).

## Three different levels of evidence

| Statement | Phase 3c proof |
| --- | --- |
| Archive package bytes agree with their own original manifests | Phase 3b verifier re-runs on original downloaded archives, 34/34 assets |
| A specific Github workflow checked and attested the frozen archive-review receipt | Cryptographically verified by `gh attestation verify` with repo + signer-workflow + expected source commit/ref |
| The original film-build workflow itself emitted a cryptographically signed provenance attestation | **NOT_ESTABLISHED** by retrospective review; original build runs were not attested |
| Engineering physics correctness, hardware isolation or release approval | **NOT_EVALUATED**, remains `releaseReady=false` |

Signed receipts are not a source of original build origin. **Never assign `originAssurance=ATTESTED` to the original preview packages as a consequence of signing only their audit report.** Treat any branch whose code is not owner-reviewed and protected as experimental, even when Sigstore authenticates the precise branch commit.

## Scope of the pilot workflow

The stand-alone workflow `.github/workflows/mechanism-studio-phase3c-audit.yml`:
1. Retrieves only frozen artifacts from historical successful CI runs `43441706721` (two rigid scene previews) and `43436842938` (one reviewed recipe). It does not rebuild or create videos.
2. Runs the already-reviewed `phase3b-real-artifacts.mjs` verifier, which pins raw manifests and rehashes all 34 original payloads. It also rejects altered sidecars and cross-package replay, without changing archives.
3. Runs the strict read-only receipt guard, which refuses unexpected IDs, run IDs, manifests, assets, fabricated success and unrecognized fields.
4. Signs **the review receipt file**, not a package or film, via `actions/attest@v4` with `id-token: write`, `attestations: write` and `contents: read` permissions.
5. Verifies the real signed receipt via the genuine `gh attestation verify` command, requiring the exact `AVANT-ICONIC/skills` repository, the audit workflow identity and source SHA/ref received from the GitHub runner.
6. Performs a digest-tamper negative check and publishes the small signed audit receipt as an Actions artifact.

A review workflow that signs arbitrary reports without independently verifying the archive bytes is not allowed. A separate promotion of artifacts under a draft PR is **not** a trusted release. Production trust requires externally pinned, owner-approved workflow source SHA and a protected release policy; no generic `--owner`-only check may satisfy it.

## CLI contracts

```sh
node mechanism-studio/attestation/check-archive-receipt.mjs audit-receipt.json
node mechanism-studio/attestation/verify-signed-audit.mjs \
  audit-receipt.json EXACT_EXPECTED_SIGNER_SOURCE_SHA EXACT_EXPECTED_SIGNER_SOURCE_REF
```

The source SHA and source ref must come from the **verifier's independent trust policy**, never solely from the user-supplied receipt. The CI smoke example uses the runner-supplied `GITHUB_SHA` as a binding check. For any production trust decision, reviewers must independently pin a protected and approved source commit. The verifier does not accept caller-supplied repository or workflow identity and does not allow downgrading to `--owner`.

The verifier emits `auditSignature: VERIFIED` only after the real GitHub/Sigstore verification succeeds, while `originalBuildOrigin: UNATTESTED`, `physicalCertification: NOT_EVALUATED`, `releaseReady: false` remain unchanged. It fails closed when `gh` is missing, the signed audit cannot be found, source identity differs or its bytes change.

## Exit criteria and remaining limitations

- Node negative tests and review-receipt validator pass on a snapshot.
- One actual GitHub-issued Sigstore attestation for the real review receipt verifies against exact workflow and source digest.
- Re-running the verifier against altered audit bytes is rejected.
- Do not merge automatically, change package writers or edit the 3b verifier. No new film CI.
- **Remaining genuine build-origin work:** Add provenance attestation during the original package-producing workflow for **future** builds, ideally on a protected branch/reviewed workflow. Its subject should be a full package archive/digest, with restrictive signer/source identity policy; it cannot be inferred from this retrospective audit.
