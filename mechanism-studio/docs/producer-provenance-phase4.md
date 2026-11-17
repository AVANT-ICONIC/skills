# Mechanism Studio · Phase 4 · future producer provenance

**State:** canonical producer TAR builder, verifier, tests, and isolated reusable signer on a separate draft branch. **Not merged, not connected to film-producing jobs, not a release.**

## Critical prerequisite (2026-11-17)

GitHub's main-branch endpoint for AVANT-ICONIC/skills reports **protected: false** and the repository ruleset endpoint returned an empty array.

A valid Sigstore signature from an unprotected source cannot be treated as an independently governed production release. The reusable signer rejects invocations except an explicit workflow_dispatch on refs/heads/main with github.ref_protected == true. Existing and new preview packages retain releaseReady=false. No governance settings were changed automatically.

Before activating producer signatures, require demonstrable protected-main rules (review approvals, no unauthorized direct/force pushes and required checks) plus an independent consumer policy that pins the reviewed workflow/source revision.

## Canonical producer archive

Use mechanism-studio/attestation/producer-archive.mjs:

~~~bash
node mechanism-studio/attestation/producer-archive.mjs pack rigid \
  /tmp/producer-rigid.tar \
  /path/to/dual-drive-linkage-study-004 \
  /path/to/single-drive-rail-study-005
node mechanism-studio/attestation/producer-archive.mjs pack reviewed \
  /tmp/producer-reviewed.tar \
  /path/to/slider-crank-study-002 \
  /path/to/four-bar-crank-rocker-study-003
node mechanism-studio/attestation/producer-archive.mjs verify rigid /tmp/producer-rigid.tar
node mechanism-studio/attestation/producer-archive.mjs verify reviewed /tmp/producer-reviewed.tar
~~~

This deterministic GNU-tar-compatible USTAR archive contains exactly two previously validated legacy package directories, sorted by path under immutable package IDs. Only manifest-listed regular files plus each manifest are permitted. The header, ordering, padding, trailer, UID/GID/mode/mtime and size limits are checked; symlinks, traversal, extra files, noncanonical TAR metadata, duplicate names and overwrites fail closed.

The reader safely decodes the bounded canonical TAR in Node, writes only validated regular entries to temporary directories, then reruns the original legacy verifier on each extracted package. It does not trust a TAR name as proof of origin or unpack arbitrary TAR types with shell utilities.

The resulting TAR is the exact intended future actions/attest@v4 *subject*, not a JSON review report. Unlike Phase 3c this can authenticate an actual new build output, once integrated into an approved producer pipeline.

## Node-only acceptance

The dedicated lightweight workflow (mechanism-studio-producer-archive.yml) runs all legacy, model, schema, security, phase 3b and phase 3c tests plus frozen five-fixture compiler parity. It downloads four genuine Phase-2 packages (two rigid, slider-crank and four-bar), creates one TAR for each family and roundtrips both via the strict reader.

No Teardown, Chromium, Playwright or FFmpeg installation; no new film rendering. These old packages prove archival compatibility, **not fresh producer provenance**.

## Reusable signing job prepared but inactive

.github/workflows/mechanism-studio-producer-signer.yml is triggered only by workflow_call and has no independent push/PR triggers. This separate job exclusively owns id-token:write and attestations:write; existing producer jobs keep read-only permissions. The job:

1. Fails unless invoked by a manual workflow_dispatch on protected main.
2. Accepts only the rigid or reviewed family with the exact corresponding GitHub artifact name.
3. Downloads the canonical TAR from the **same originating workflow run**.
4. Reruns the strict TAR plus legacy manifest/package verification.
5. Signs the **exact TAR bytes** with GitHub OIDC/Sigstore.
6. Uses gh attestation verify with exact repository, reusable signer path, source SHA and ref.
7. Publishes the signed TAR alongside its verification receipts, not any modified film.

The reusable signer identity requirement follows GitHub's own guidance for signatures emitted through reusable workflows.

## Explicit producer workflow integration (future change only)

This is **not applied** to the old producer workflows yet. Editing those workflow files would trigger expensive Chromium/film CI on a draft, and main currently has no branch protection.

After the existing rigid-scene workflow has finished producing and checking its two packages, it can prepare the original-run signed subject only when protected-main workflow_dispatch is true:

~~~yaml
      - name: Prepare canonical producer TAR
        if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && github.ref_protected
        run: |
          node mechanism-studio/attestation/producer-archive.mjs pack rigid \
            "$GITHUB_WORKSPACE/.artifacts/producer-rigid.tar" \
            "$GITHUB_WORKSPACE/.artifacts/rigid-package/dual-drive-linkage-study-004" \
            "$GITHUB_WORKSPACE/.artifacts/rigid-package/single-drive-rail-study-005"
      - name: Upload protected-main producer TAR
        if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && github.ref_protected
        uses: actions/upload-artifact@v4
        with:
          name: mechanism-studio-producer-rigid
          path: .artifacts/producer-rigid.tar
          if-no-files-found: error
~~~

Call the reusable workflow separately after the rigid_scene producing job completes:

~~~yaml
  signer:
    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && github.ref_protected
    needs: rigid_scene
    uses: ./.github/workflows/mechanism-studio-producer-signer.yml
    permissions:
      contents: read
      actions: read
      id-token: write
      attestations: write
    with:
      family: rigid
      artifact-name: mechanism-studio-producer-rigid
~~~

For the generated reviewed recipe workflow, use family reviewed, the name mechanism-studio-producer-reviewed, output .artifacts/producer-reviewed.tar, existing source directories .artifacts/generated-study-package and .artifacts/four-bar-study-package, and needs: generation.

**Do not merge these snippets into producer workflows until branch governance and new-package signer policy are approved.** The reusable job is written but no protected-main producer job has called it yet.

## Nonclaims

This phase does not retroactively authenticate the original historic build outputs, make engineering or physics claims, verify external source documents, certify host isolation/hardware GPU, set releaseReady=true or establish a cryptographically trusted release under an unprotected branch. Exact trust depends on the verified issuer/workflow identity **and** separately enforced source/ref policy.

## Security addendum and real gates (2026-11-17)

GitHub security advisory [GHSA-wjmr-j3rp-mh2g](https://github.com/cli/cli/security/advisories/GHSA-wjmr-j3rp-mh2g), published 2026-09-30, confirms `gh attestation verify --signer-workflow` used a **prefix match** in CLI versions 2.51.0 through 2.101.0. Version **2.102.0** fixed the signer-workflow identity bug. Therefore `attestation/gh-cli-policy.mjs` refuses all `gh` versions below 2.102.0, malformed output and prereleases. Both the reusable future signer and the inherited Phase-3c audit verification now call this gate before relying on cryptographic verification.

The future reusable signer also explicitly sets **both** `--source-digest "$GITHUB_SHA"` and `--signer-digest "$GITHUB_SHA"`, along with exact workflow and ref. The separately implemented `verify-signed-producer.mjs` consumer requires **two independently supplied approved source and signer commits**, applies the patched CLI gate, verifies the original canonical TAR, enforces the expected signer, source ref and GitHub-hosted runner, and refuses to set `releaseReady=true`. Passing an untrusted self-declared commit from the package is **not** an approval policy. `governanceApproval` deliberately remains `NOT_EVALUATED`.

**Confirmed [Node-only workflow #44074539384](https://github.com/AVANT-ICONIC/skills/actions/runs/44074539384):**
- **157/157 tests PASS**, **five frozen golden fixtures PASS**; both original Phase-2 package families roundtrip to byte-stable canonical TARs and back.
- Installed CI GitHub CLI **2.103.3** passed the >=2.102.0 security gate.
- Previous real [Phase-3c Sigstore-signed audit receipt](https://github.com/AVANT-ICONIC/skills/attestations/68199050) passed again using the new CLI-version gate plus independently pinned **source and signer digests**.
- The new future producer consumer rejected a *real, valid but unsigned* rigid TAR at the **actual GitHub CLI cryptographic verification** step, rather than accepting archive hash matches as provenance.
- No rendering, publisher certificate for a fresh producer build, source approval, or merge was performed.

The prior Phase-3c helper was patched on its own draft PR #39 and synchronized into draft PR #40 without changing any existing legacy package/verifier bytes. The suite evidence applies to the same implementation tree despite subsequent documentation-only commits.

**Still missing:** Effective protection and independent review of `main` (GitHub currently reports `protected:false`, no rulesets); integration of this reusable signer into a genuine protected-main producing workflow; a newly emitted real producer TAR attestation; independent consumer verification of that newly produced signature. The branch protection change is a repository-governance operation and was **not** made through the available GitHub connector.
