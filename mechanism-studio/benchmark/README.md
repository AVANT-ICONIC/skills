# Mechanism Studio · Stage 0 benchmark

This is **a benchmark harness**, not an installed or working Mechanism Studio skill. It probes the candidate upstream Teardown runtime against the locked architecture in [specification PR #17](https://github.com/AVANT-ICONIC/skills/pull/17). This branch does not implement the viewer/video/evidence-package generator.

## Security and reproducibility boundary

- Upstream is pinned by full Git commit and SHA-256 of `package-lock.json` in `upstream.lock.json`. No mutable tag or latest-branch resolution is allowed.
- The benchmark does **not** download or install anything. A caller explicitly prepares the upstream checkout, dependencies and browser before execution.
- CI performs network-dependent preparation without credentials, with read-only repository permissions and no persisted checkout token. It builds a fixed, publicly inspected upstream revision in an ephemeral runner.
- During browser observation, the harness blocks HTTP(S) requests and records attempts. This does **not** provide OS-level isolation against arbitrary JavaScript, CLI build scripts or native packages. Do not run it on untrusted customer sources or hosts containing secrets. The product requires stronger isolation before accepting arbitrary generated code.
- Outputs are local CI artifacts, not a published release.

## Run locally (after explicit environment setup)

```bash
node --test mechanism-studio/benchmark/benchmark.test.mjs
node mechanism-studio/benchmark/benchmark.mjs \
  --upstream /path/to/pinned/teardown \
  --output .artifacts/mechanism-stage0
```

Expected upstream checkout: `elvarofficial/teardown@a91262ac1109051e014662d42ecb0b7bc1f113b1`. The script verifies Git HEAD, license and the complete lockfile hash. It expects installed upstream `node_modules` and matching Playwright Chromium. Node 22, FFmpeg/FFprobe and Git must be on PATH. Python is optional for the silent-film benchmark.

## Current scope

Build `v8-live`, `v8-film`, `cessna-live`, `cessna-film`. Live pages use `runLive()` (not `window.SIM`), while film pages expose `window.SIM.render(t)`. The probe tests same-session frame seeking, exercises one live control, captures short H.264 MP4 samples and verifies with FFprobe. Geometry check: 32-tooth/module-4 pinion over 180 degrees yields 201.0619 mm, so nominal 201 mm is a rounded approximation.

This benchmark is **not the full Stage 0 exit gate**: physical integrated-GPU performance, independent physics qualification, complete offline portability, host process isolation, decoded visual review and viewer/video/evidence packaging remain separate. A green CI job alone does not mean Stage 0 is complete.

## Evidence and failures

The run writes `report.json` with PASS/FAIL/NOT_EVALUATED per probe, file hashes and tools. On failure it exits nonzero, and CI attempts to upload evidence. Performance and process containment are explicitly NOT_EVALUATED. If setup fails before the script starts, consult the CI job log; do not claim a nonexistent report.
