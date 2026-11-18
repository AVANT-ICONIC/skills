# Mechanism Studio · development handoff

**Working PR:** [#40](https://github.com/AVANT-ICONIC/skills/pull/40)  
**Working branch:** `feat/mechanism-studio-producer-provenance-phase4-20261117`  
**Base:** `feat/mechanism-studio-audit-attestation-phase3c-20261116` (draft PR #39)  
**Other stacked draft PRs:** #35 (3a), #37 (3b design), #38 (3b implementation).  
**All PRs remain draft/unmerged.** Do not merge or enable production trust on your own.

## Goal

Complete Mechanism Studio Phase 4's future **producer-side** provenance with canonical, mechanically bounded archives and verified exact Sigstore workflow/source identity. No retrofit of historic film-origin claims. Avoid rerendering Chromium/FFmpeg films for verifier-only work.

## Done and verified

1. Two independent v1 legacy package readers plus detached Phase-3b proof index tested; both package schemas untouched, `releaseReady=false`.
2. Phase 3c retrospective archive *audit receipt* signed and independently verified. Historic producer itself remains `UNATTESTED`; its certificate authenticates only the reviewer.
3. Phase 4 deterministic canonical USTAR packer/verifier; exact expected two packages per family, no manifest extras, no traversal/symlink/noncanonical headers, strict size bounds. Its publisher now uses **atomic `linkSync` no-clobber** instead of overwrite-prone `renameSync`.
4. Cheap Node/legacy/golden tests **165/165 PASS**, including a real parallel-two-writer race test and the certificate-claims tests plus two destination-symlink tests; 5/5 frozen PR #32 golden fixtures. [Latest permanent CI #44326794341](https://github.com/AVANT-ICONIC/skills/actions/runs/44326794341).
5. Four historical Phase-2 packages, total 46 assets, already verified as deterministic canonical TARs. Real historical manifests were pinned by SHA-256; old films not rebuilt. Two historical TAR family digests: rigid `df61d95efb02f6051d02f3d727e9ccb5b7b4c1fdde0b33200646ee675a4d3858`, reviewed `a317b2b65b2adfc6976ec970b653f09a14ae46b236b526b02af8615a38e40079`.
6. **Actual temporary pilot Sigstore issuance**: [pilot run #44112576203](https://github.com/AVANT-ICONIC/skills/actions/runs/44112576203), [pilot attestation #68679643](https://github.com/AVANT-ICONIC/skills/attestations/68679643) for the rigid TAR that rewrapped original archived files on a *feature branch*. Separate runner with read-only token verified exact pilot workflow identity and both SHA pins. Wrong workflow, signer SHA and payload rejected. Critically, the strict **production consumer rejects the genuinely signed pilot TAR**, because its source and signer are not the approved protected-main producer.
7. The temporary feature-branch signing workflow was **deleted after passing** so no unnecessary capable-of-signing pilot remains in the proposed PR. The immutable Actions logs retain evidence.
8. A separate `workflow_call`-only production signer is prepared and fail-closed on non-protected-main manual dispatch. Its actual production invocation has NOT happened. GitHub CLI >=2.102.0 is required because of the signer-workflow prefix-match advisory (CI used 2.103.3).
9. The normal Phase-4 push CI no longer depends on **expiring historic GitHub artifacts**. Only explicit manual `workflow_dispatch` rechecks use the old two Phase-2 and Phase-3c artifact runs. Normal cheap CI still tests full Node suite and frozen compilers.
10. The production consumer now runs `producer-provenance-result.mjs` on **actual `gh attestation verify --format json` output**, independently enforcing exact signed certificate repo/workflow/branch, both approved source and signer commits, Github-hosted runner, manually triggered build and exact SLSA subject. [Real signed pilot verification #44287816626](https://github.com/AVANT-ICONIC/skills/actions/runs/44287816626) PASSED with the new parser; a mutated certificate signer digest was rejected. **It is not a production approval.**
11. The temporary, read-only Sigstore schema probe was **removed after successfully exercising the real certificate**. No new signatures or film work were performed.
12. **Actual `workflow_call` signer tested end-to-end:** [3-job run #44288756562](https://github.com/AVANT-ICONIC/skills/actions/runs/44288756562) passed. Producer repacked the original two rigid packages; separate reusable workflow signed that exact historical TAR ([Sigstore attestation #69086461](https://github.com/AVANT-ICONIC/skills/attestations/69086461)); third, read-only runner verified the genuine reusable workflow certificate using both commit pins and the Phase-4 SLSA-claims parser. The strict protected-main consumer **correctly rejected** that otherwise-valid feature-branch signature. Both temporary pilot workflow YAML files were removed from the branch after the successful run; no long-lived unprotected signer remains. This does NOT establish original 2026 film-producer provenance or release trust.
13. **Static output symlink misdirection fixed:** Producer TAR destinations now resolve to their real filesystem location, including an existing symlink ancestor and initially missing nested directories, before writing into the source tree. [CI #44326241108](https://github.com/AVANT-ICONIC/skills/actions/runs/44326241108) passed with two new regression tests; a truly concurrent hostile filesystem remains outside sandbox claims.
14. **Producer signer self-check hardened:** After genuine signing, the protected-main-only signer now calls the full `verify-signed-producer.mjs` consumer instead of a weaker separate `gh` check. It must validate canonical TAR bytes plus real signed certificate fields and both digests before publishing. [CI #44326794341](https://github.com/AVANT-ICONIC/skills/actions/runs/44326794341) passed the 165-test suite and signer-order contract. The actual protected-main path remains unexecuted.

## Current governance blocker (check again before acting)

GitHub API last returned `main.protected=false` and zero active repository rulesets. Its native branch protection endpoint returned 403 under connected GitHub integration. **No branch protection rules have been modified.** Production signer must not be activated or marked trusted until an authorized owner applies and verifies effective branch protection/required review/checks; independent consumer needs a reviewed and externally pinned source+signer SHA policy.

## Read first on next continuation

- `mechanism-studio/docs/producer-provenance-phase4.md`
- `mechanism-studio/attestation/producer-archive.mjs`
- `mechanism-studio/attestation/verify-signed-producer.mjs`
- `.github/workflows/mechanism-studio-producer-signer.yml`
- `.github/workflows/mechanism-studio-producer-archive.yml`
- `mechanism-studio/attestation/*.test.mjs`
- [Phase 4 PR #40](https://github.com/AVANT-ICONIC/skills/pull/40)

## Next concrete steps

1. Latest permanent cheap Node-only CI **165/165 PASS and five compiler goldens**, [run #44326794341](https://github.com/AVANT-ICONIC/skills/actions/runs/44326794341). Continue verification after future edits; do not invoke expensive film CI for verifier-only work.
2. The SLSA certificate-claims guard has passed real direct and reusable feature-branch pilots. The protected-main signer now reuses the full strict consumer before publishing but **has not been executed**. Validate it once governance enables a protected-main build. Static symlink containment and `linkSync` no-clobber have been tested; a malicious concurrently mutating filesystem is still **not** sandboxed.
3. After effective main protection is verifiably enabled and the stacked PRs reviewed, integrate the canonical TAR packaging and reusable signer call into the **real producer jobs** in a separate change. This will touch expensive render workflows, so do not do it for a verifier-only CI request.
4. Run a genuinely new, protected-main original producer build and independently verify its signed TAR under a separately approved trust policy. Only then could *new-build provenance* be reported as authenticated. **Never** infer certified physics/physical safety or `releaseReady=true` from Sigstore.
5. If original historical artifacts expire, do not silently replace them with fake fixtures or claim they were reverified. Keep the synthetic permanent regression suite, frozen test evidence and signed audit separately.

## Open problems

- Unprotected `main` and unavailable GitHub-protection mutation tool.
- No actual producer-signer `workflow_call` on protected main.
- Historic CI assets have short retention; manual artifact checks will eventually fail when those artifacts expire.
- No mechanical engineering certification, trusted external source provenance, host isolation or deployment/release authorization.
