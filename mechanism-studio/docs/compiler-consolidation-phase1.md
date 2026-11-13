# Mechanism Studio compiler consolidation: phase 1

**State:** draft compatibility layer. The two existing compiled-source formats, preview package schemas, runtime files and encoded-film specifications are unchanged. **No cutover** to a common IR/manifest. `releaseReady=false` remains mandatory.

## Ownership and compatibility boundaries

| Concern | Canonical phase-1 owner | Preserved legacy contract |
| --- | --- | --- |
| Entry-point schema selection | `scripts/compile-study.mjs` | Reviewed `avant.mechanism-request/1` and rigid `avant.rigid-scene/1` dispatch only; no guessing |
| HTTPS technical reference safety | `scripts/source-validation.mjs` | Profile-specific rules and exact serialized reference property order retained |
| Safe compile destinations and cleanup | `scripts/compiler-io.mjs` | Existing `*.stage-PID` names, atomic rename, current errors and no overwrite |
| Byte-level compare receipt | `scripts/portable-receipt.mjs` | Comparisons only; **does not replace** either preview package reader or package schema |
| Reviewed recipe format | `scripts/compile-request.mjs` | The three original audited model families, existing `--request`, `--out` and `--list` CLI syntax |
| Bounded generic rigid scenes | `rigid-scene/compile-scene.mjs` | The five-bar and prismatic-slider graphs, existing two-positional-argument CLI syntax |

The old CLIs use `compileStudy` to select an explicitly provided trusted handler. A new `compile-study.mjs --input FILE --out NEW_DIR` entrypoint dispatches from exact schema strings. Direct `compileRequest` and `compileScene` JavaScript exports still work, without changed return receipts. The backends continue to own their schema-specific numerical/graph validation and reviewed template selection. This is intentional; consolidating those backends now would risk mathematical and visual regressions.

Runtime validation inside `rigid-scene/scene-core.mjs` is *intentionally retained*. It is bundled and independently checks scene data in browser environments. Compiler-ingress source validation is now shared but that does not remove the runtime trust boundary. No new runtime imports were added, and the compiled `scene-core.mjs` bytes are unchanged.

## Five-fixture golden acceptance gate

The frozen source baseline is **PR #32 commit `e952c699fe0f83ceb9b127a469db7bcb8930d667`**.

| Fixture | Prior CLI |
| --- | --- |
| `requests/geneva-four-slot-study.json` | `compile-request.mjs --request ... --out ...` |
| `requests/slider-crank-study.json` | Same |
| `requests/four-bar-study.json` | Same |
| `rigid-scene/scene.json` | `compile-scene.mjs INPUT OUTPUT` |
| `rigid-scene/slider-rail.json` | Same |

`compatibility/compiler-parity.mjs` executes **15 actual compilations**: each fixture with the PR #32 frontend, the corresponding current frontend, and the new canonical frontend. It rejects any input fixture hash change, file-count change, filename change or byte/hash difference, including data modules, CSS, source registers, viewer source, audio/director modules and generated README files. It separately verifies source/film runtime and package readers themselves remain byte-identical. The checker neither reads nor rewrites a preview manifest and cannot silently upgrade 
`avant.mechanism-package/1` or `avant.rigid-scene-package/1`.

### Run

~~~bash
# From repo root, after preparing a detached PR32 checkout at /tmp/mechanism-pr32
node --test mechanism-studio/compatibility/phase1.test.mjs
node mechanism-studio/compatibility/compiler-parity.mjs --baseline-dir /tmp/mechanism-pr32
node mechanism-studio/scripts/compile-study.mjs --list

node mechanism-studio/scripts/compile-study.mjs \
  --input mechanism-studio/rigid-scene/scene.json \
  --out /tmp/dual-drive-linkage-study-004
~~~

In the dedicated rigid-scene CI, an ephemeral second checkout of the frozen SHA supplies the baseline. This runs **before** Teardown/npm/Chromium, so any byte drift fails cheaply. The prior generation CI and rigid-scene CI continue to verify all five builds, real browser controls and films from the unchanged templates. Do not claim film bitstream identity simply from the source parity check; use the actual capture/decoder evidence on the exact CI revision.

## Hard non-goals and rollback

- No new `avant.mechanism-study/2` output in phase 1.
- No template moves, kinematic solver swaps, changes to named machine limits, or source-document fetches.
- No fake `contentChecked=true`, no rights certification, no certified physics, no host OS sandbox claim.
- No manifest change, video profile change, or `releaseReady` promotion.
- If even one file differs from the PR #32 golden baseline, keep this PR **draft/unmerged** and repair the shared layer rather than weakening the diff comparator.

**Phase 2** may centralize the renderer template after this golden contract passes. **Phase 3** may migrate receipts and package schemas only with a separate migration reader and explicit reviewed acceptance. Old CLIs remain supported throughout.
