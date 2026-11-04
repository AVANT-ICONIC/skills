# Mechanism Studio: technical design

Status: **SPECIFICATION ONLY — NOT IMPLEMENTED**
Inputs: [proposal](proposal.md) and [requirements R1–R12](requirements.md)
Future code root: AVANT-ICONIC/skills/mechanism-studio/
Upstream baseline candidate: [elvarofficial/teardown@a91262ac1109051e014662d42ecb0b7bc1f113b1](https://github.com/elvarofficial/teardown/commit/a91262ac1109051e014662d42ecb0b7bc1f113b1)
Related consumer proposals: [Motion OS #6](https://github.com/AVANT-ICONIC/motion-os/pull/6), [ICONICUT #2](https://github.com/AVANT-ICONIC/iconicut/pull/2).

## 1. Evidence from inspected upstream and repositories

Inspected 2026-11-02:

- teardown README.md, SKILL.md, package.json, package-lock.json, LICENSE, sims/build.mjs, sims/kit/runtime.js, sims/capture.mjs, sims/v8-shared/kin.js.
- teardown's build script bundles a named scene or an external machine folder containing main.js using esbuild and an alias for teardown-kit/*. Output is an HTML file under teardown-out/dist. Large .glb assets can be external and copied alongside the page.
- teardown's runtime has a setup path returning render(t) and resize(). In capture mode it exposes window.SIM.render(t) and window.SIM.ready; capture.mjs accesses them with Playwright and sends frames to ffmpeg. Capture also supports HTML pages exposing window.seek(t).
- package.json lists Node 20+ per skill guidance, esbuild 0.28.1, playwright 1.58.2, three 0.186.1 and bundled font packages. The package is private: true but the repository source license is MIT. No npm-published runtime is assumed.
- AVANT-ICONIC/skills is a public MIT collection of portable skill folders and already has anti-sloprush, gauntlet-loop and architecture-guard. No existing mechanism-studio folder or recognized OpenSpec config was found in the checked locations.
- ICONICUT's V5 agent import and Motion OS's existing Director/Chromium renderers are owned separately. Neither is a dependency of v1.

**Inspection is not a successful execution.** The pinned SHA is a candidate baseline until a real checkout/build/capture passes.

## 2. Proposed modules and canonical owners

Proposed future tree (illustrative, NONE of these files exist from this spec PR):

~~~text
mechanism-studio/
  SKILL.md                     # portable decision/activation and generation guidance
  upstream.lock.json           # one authoritative immutable upstream pin
  references/
    model-contract.md          # factual/illustrative source labeling
    teardown-adapter.md        # supported upstream invocations and limitations
    production-qa.md           # measured, artifact-grounded review checklist
  schemas/
    package-v1.schema.json     # portable package, capabilities, timebase, hashes
    evidence-v1.schema.json    # verification records and provenance
  scripts/
    doctor.mjs                 # read-only dependency/runtime and lock diagnostics
    prepare.mjs                # explicit opt-in checkout/verified install
    generate.mjs               # invoke pinned builder from isolated work folder
    capture.mjs                # frame-addressable capture adapter wrapper
    package.mjs                # canonicalize, hash, stage and publish
    verify.mjs                 # offline, integrity and evidence gates
  tests/
    fixtures/                  # small benign sample sources and adversarial manifests
    *.test.mjs                 # stdlib Node tests
docs/specs/mechanism-studio/    # THIS specification; not runtime code
~~~

The implementation MAY consolidate scripts if direct, readable modules require fewer files. No generic engine registry, abstract workflow builder, copy of upstream's Three.js renderer, or second editable project store at v1.

## 3. Dependency model

**Lock file (future)**

- Store full 40-character git commit, upstream repo URL, upstream license details, expected package-lock.json SHA-256, runtime contract probe version and explicit test support matrix.
- Resolve checked-out upstream by exact commit, not branch or mutable tag. Record effective git HEAD and lock hash in every artifact manifest/evidence receipt.
- Check out into an explicit user-owned local cache/workspace outside the skills git tree. Avoid tracking generated HTML, node_modules, downloaded browser binaries, video and licensed references in AVANT-ICONIC/skills.
- Doctor has no side effects and must not fetch packages. Prepare is explicitly invoked before any network or npm execution, verifies the commit and lockfile, then installs dependencies with reproducible lockfile semantics. Audit package lifecycle scripts and subprocess behavior as part of setup; never assume npm install is a pure download.
- Pin the effective Playwright browser build or record executable version/path. Different browser/GPU environments are distinct reproducibility profiles.
- Use Node 20+ for the initial compatibility gate, and ffmpeg/ffprobe for video. Python is only necessary if using upstream procedural sound; it must not prevent silent MP4 export.
- Do not auto-upgrade upstream when changing this skill; updates require an explicit SHA/lock change with benchmark receipts.

## 4. Public user workflow

The following names are **planned interfaces, not existing commands**:

~~~text
agent request + at least one reference
  -> inspect/normalize request + provenance classification
  -> doctor (read-only)
  -> prepare (explicit if pin missing, no silent fetch)
  -> generate (pinned upstream, staged workspace)
  -> validate numeric model + generated viewer
  -> capture video by deterministic frame
  -> review decoded frames + interaction + offline and security checks
  -> package + hash + verify
  -> publish verified output directory atomically
~~~

Suggested CLI UX (names can be refined during implementation without altering observable requirements):

~~~text
node mechanism-studio/scripts/doctor.mjs --json
node mechanism-studio/scripts/prepare.mjs --lock mechanism-studio/upstream.lock.json
node mechanism-studio/scripts/generate.mjs --request request.json --out ./out/watch
node mechanism-studio/scripts/verify.mjs --package ./out/watch --json
~~~

All commands must print parseable JSON with status, diagnostic code, relevant path/phase, and next actionable step on --json; CI can use exit status. Errors must not be hidden by resilient defaults or unbounded retries.

## 5. Generation request (future data contract)

A request is structured and versioned. At minimum:

~~~json
{
  "requestSchema": "avant.mechanism-request/1",
  "id": "watch-escapement-demo",
  "description": "Explain a mechanical watch escapement",
  "classification": "reference-grounded",
  "references": [
    {"id": "manual", "kind": "image", "path": "inputs/watch-cutaway.png", "redistribution": "not-authorized"}
  ],
  "controls": [
    {"id": "oscillationHz", "unit": "Hz", "default": 4, "min": 1, "max": 6}
  ],
  "deliverables": {"viewer": true, "video": true, "evidence": true},
  "video": {"fpsNumerator": 60, "fpsDenominator": 1, "frameCount": 1500, "width": 1920, "height": 1080}
}
~~~

**Example only**: input references, claimed dimensions, and outputs must be separately confirmed; the example watch oscillation values are illustrative choices, not measured values from a named watch.

Validation must reject a missing reference unless classification is explicitly conceptual/illustrative. Reject non-finite numeric inputs, duplicate IDs, inaccessible or unsafe paths, unreasonable parameter ranges, unknown major schema versions and incompatible controls.

## 6. Authoritative simulation and adapter boundary

Define the logical model as a deterministic evaluator:

~~~text
evaluateModel(frameIndex, controlSnapshot, modelConstants, seed)
  -> {pose, measurements, events}

renderFrame(frameIndex, controlSnapshot, cameraState, viewMode)
  -> rendered pixels + declared readouts/capability status
~~~

This is a **contract for generated machine code**, not a request to implement a universal solver. A mechanism may be continuously driven or event-driven. Model time = frameIndex * fpsDenominator / fpsNumerator unless an explicitly versioned time-warp mapping is present. Control values are evaluated at that frame and have validated units/ranges. For variable-rate physical processes, precompute seekable trajectories or use a deterministic analytic representation.

The thin teardown adapter performs these tasks only:

1. Confirm pinned upstream code matches expected capture/boot method and machine layout.
2. Invoke the existing upstream builder in an isolated work directory; do not edit upstream source to add a compatibility layer by default.
3. For film capture, seek the existing window.SIM.render(t) or window.seek(t) entrypoint under controlled browser execution. The upstream API uses floating seconds; adapter converts integer frames to seconds once at the boundary.
4. Extract or require capability metadata for controls, camera modes and cutaways; never infer supported editing capabilities from appearance.
5. Validate package assets, timebase, recorded model/readout snapshots, provenance and evidence. Do not invent physical readouts in the adapter.
6. When an existing machine cannot expose model snapshots or capability metadata, mark that capability NOT_EVALUATED or unsupported. Do not claim physics checks through pixel output alone.

Any injection into an upstream page or extension of its HTML should be minimal, version-pinned and tested against the inspected revision. Do not grant a generated page direct access to host files or environment variables. Never assume the upstream's window.SIM is a public versioned API.

## 7. Delivered package v1

Directory structure:

~~~text
watch-escapement-demo/
  manifest.json
  viewer/
    index.html
    ...local optional model/texture assets...
  video/
    film.mp4
  preview/
    poster.png
    contact-sheet.png
  evidence/
    report.json
    source-register.json
    checks/
      ...selected numeric and interaction receipts...
  NOTICE
  LICENSES/
    ...required third-party notices...
~~~

All referenced assets must have relative normalized POSIX paths within the package, a SHA-256 digest and media type. No manifest self-hash. Generated files are prepared in a staging directory, verified, then published with atomic replacement where supported. A failed build must preserve the last valid output.

### Manifest shape (illustrative, not yet a JSON Schema)

~~~json
{
  "schema": "avant.mechanism-package/1",
  "packageId": "watch-escapement-demo",
  "generator": {
    "name": "teardown",
    "repository": "https://github.com/elvarofficial/teardown",
    "revision": "a91262ac1109051e014662d42ecb0b7bc1f113b1"
  },
  "mechanism": {"classification": "reference-grounded", "modelId": "escapement-1", "unitSystem": "SI"},
  "timebase": {"fpsNumerator": 60, "fpsDenominator": 1, "frameCount": 1500},
  "capabilities": {
    "live": true,
    "seek": "arbitrary",
    "cameras": ["hero", "side"],
    "cutaways": ["escapement"],
    "controls": [{"id": "oscillationHz", "unit": "Hz", "min": 1, "max": 6, "default": 4}]
  },
  "entrypoints": {
    "viewer": "viewer/index.html",
    "video": "video/film.mp4",
    "poster": "preview/poster.png",
    "evidence": "evidence/report.json"
  },
  "assets": [],
  "credits": ["NOTICE"],
  "offline": {"requiresLocalServer": false, "externalRequests": false}
}
~~~

The empty assets array above omits required actual file hash entries **for readability only**. A valid package must enumerate and verify every deliverable and any viewer assets with correct hashes. Schema must reject this illustrative manifest as incomplete; the formal fixture with real hashes belongs in future tests. The video duration is exactly frameCount * fpsDenominator / fpsNumerator; no independent duration field may contradict it.

Evidence schema should include machine-readable checks with: id, requirement ID, status (PASS/FAIL/NOT_EVALUATED/KNOWN_LIMITATION), measured value, tolerance/expected value, source, artifact SHA, tool/version, timestamp, and log/still path as relevant. A successful package MUST have every mandatory gate PASS, with specific physical assumptions documented as KNOWN_LIMITATION in non-hard validation claims.

## 8. Security architecture and failure policy

Treat upstream source and generated machine code as untrusted.

- Do not execute generated JS in the host Node process; it belongs to a sandboxed browser context with no credentials, mounted secrets, or privileged application bridges.
- Use a new temporary browser profile per run, no inherited cookies, service workers or persistent storage. Restrict request URLs to an assigned loopback-only static asset origin. Block other schemes, off-origin HTTP(S), localhost admin ports, popups and downloads.
- Do not disable same-origin policy / web security to make local assets load. For bundled HTML known to be fully self-contained, file:// may work. For separate .glb/texture assets, serve read-only from a loopback-only server scoped to package root. “Offline” means no public internet dependency.
- Playwright route restrictions alone are not a complete security sandbox. At implementation, evaluate process/container isolation and OS-level outbound network restrictions. If the host cannot enforce the required isolation for arbitrary generated code, mark unsafe execution unsupported; don't claim containment.
- Build scripts and package installation are separate trust boundaries. Prepare must vet the source revision, lockfile and dependencies; run in a credential-free bounded environment with explicit authorization.
- Set configurable, documented hard limits for time, concurrency, memory, GPU workload and total output bytes, chosen from benchmark observations. Abort and report typed errors on limit violation.
- Reject path traversal, absolute file paths, symlink escapes, malformed hashes and network-dependent asset references in package validation.
- Preserve third-party MIT text and recorded CC0 source inventory when needed. Reference images marked non-redistributable are inputs and must not be blindly packaged into public outputs.

## 9. Verification design

Every executable gate records a structured receipt; no tests are claimed as run until an actual invocation is observed.

### Compatibility benchmark (first implementation task)

- Pin and inspect the upstream checkout; validate package-lock digest and dependency integrity.
- Build and open upstream V8 and Cessna live/film examples. Confirm controls, capture interface, selected stills, resulting MP4 and capture metadata.
- Verify the Cessna's rack distance against pitch diameter: 32 * 4 mm = 128 mm; half circumference = pi * 128 / 2 = approximately 201.062 mm. Treat displayed 201 mm as rounded nominal, not mathematically exactly 201 mm.
- Capture frames in randomized nonsequential order and compare authoritative state/readouts when accessible; compare pixel output on same renderer/settings, with documented tolerance for cross-GPU differences.
- Record browser, OS, GPU, software renderer, dependency versions and test failures. Capture decoded video contact sheets, not only pre-encode stills.
- Attempt intentionally malformed manifests and missing resources; validate that failures are visible and no fake success package is created.

### Original machine reference test

- Use a reference-grounded mechanical watch escapement or another documented mechanism chosen by the implementer. Keep reference rights separate from distribution.
- At least one known geometric invariant, one boundary pose, one readout agreement test, and one cutaway/camera transition must pass.
- Viewer supports at least one model control and an inspectable measurement trace. Label any approximated forces, torque or friction as illustrative.
- Test idle tour takeover, keyboard, zoom/orbit, touch if advertised, offline use, low-quality tier, and artifact regeneration after a deliberate parameter change.

### Package acceptance

- Validate schema and all SHA-256 hashes.
- Open in a copied offline directory; test viewer in an ordinary supported browser.
- Use ffprobe and decoded MP4 frames to compare length/timebase and screenshot content.
- Evaluate warnings separately from mandatory gates. No green “PASS” claim when a hard gate is NOT_EVALUATED.
- Preserve evidence timestamps, artifact hashes and last valid package through failed subsequent regeneration.

## 10. Integration boundaries after standalone MVP

**Motion OS** is allowed to read the package manifest/MP4 or an isolated frame adapter. Motion OS controls film scene pacing, typography, transitions, final mix and renderer selection, while the simulation owns the pose and raw measurements. Integration must follow its existing Director and compositor; no new film pipeline inside the skill.

**ICONICUT** initially imports baked MP4 through its existing editor/agent media path where supported, with an optional sidecar. Editable timeline video ≠ parametrically editable 3D scene. Parameterized render islands and part-level manipulation need separate design and approval; do not touch active Rust/preview/export migration for v1.

Both integrations consume package schema and pins, not a mutable globally installed skill. They must handle source generator absence gracefully via the MP4 fallback.

## 11. Future engine extraction criteria

Consider a separate AVANT-ICONIC mechanism-engine repository only if multiple verified requirements cannot be expressed through a versioned thin adapter, or if upstream maintenance/release costs exceed an independently maintained library. Supporting signals: repeated unavoidable upstream patches, stable reusable APIs serving several consumers, independent release/CI needs, or a security isolation need unsolved by adaptation.

Before extraction, compare six-month ownership cost, actual adapter breakage rates, cross-app reuse and benchmarked performance. Until then, keep a **single** teardown adapter; do not design a hypothetical three-provider abstraction for the sake of architectural aesthetics.

## 12. Review checkpoints and ownership boundaries

Spec freeze: owner-approved public distribution, complete deliverable package, pinned upstream adapter.
Milestone gate 0: benchmark upstream without changing it.
Milestone gate 1: implement portable skill/CLI/package and verify with at least one existing example.
Milestone gate 2: ship one original mechanism through the same interface.
Milestone gate 3: decide future downstream integration using the separate Motion OS and ICONICUT proposals.
Milestone gate 4: review extraction only with demonstrated need.

No automatic merge, deploy, publication, autonomous third-party crawling or production editor code changes are authorized by this specification.
