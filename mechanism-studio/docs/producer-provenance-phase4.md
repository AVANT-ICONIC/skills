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
