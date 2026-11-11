---
name: test-velocity
description: Fast, trustworthy tests, line by line. Use whenever you write or change a test, design test architecture, diagnose a slow suite or test runner, or tune selection, caching, CI and parallelism across agents. It never replaces required integration, security, browser, hardware or release gates with mocks.
compatibility: "Portable Agent Skills Markdown. Uses installed project tooling; no required paid service or prescribed language."
---

# Test Velocity

Maximize **time to a trustworthy verdict**, not speed at any cost. A fast suite that misses regressions is a failed optimization. A slow test is a **defect**: it taxes every future run, every agent and every CI slot, so treat it like a bug in the code under test.

## Budgets

Every test has a **budget**. Use the repository's own numbers when it defines them; otherwise these defaults apply:

| Unit | Budget (CPU, user+sys) |
|---|---|
| one test case | ≤ 10 ms |
| one test file, startup included | ≤ 200 ms; over 1 s is a defect to fix before merge |
| process spawns per test file | 0, or a written reason per spawn |
| real waiting (sleep, timeout, poll) | 0 ms |
| whole local suite | ≤ 10 s |

A test that needs more carries its reason in a comment beside the costly line, and belongs to a tier (integration, end-to-end) that runs on its own schedule.

## Modes and activation

- **Blueprint**: New project or subsystem. Establish testable architectural seams, verification tiers, deterministic interfaces, and measurement budgets before implementation.
- **Author**: While writing features and regression tests. Select high-signal tests and make them cheap without weakening requirements.
- **Rescue**: Existing oversized or slow suite. Measure, identify dominant costs, propose and verify improvements against the unchanged correctness contract.
- **Fleet**: Multiple agents or CI workers. Coordinate deduplication, shard isolation, resource budgets, and shared verified cache.

Use the smallest applicable mode. If no real repository is available, produce a proposed blueprint with no invented baseline or executable claims.

Optional companions: architecture-guard for ownership/seams; gauntlet-loop for integrated behavioral verification; futurequake when empirical changeability matters. Follow existing repository and OpenSpec authority. This skill does not overrule them.

## Non-negotiable invariants

1. **Correctness first.** Preserve externally observable behavior and the ability to detect the original defect. Never delete, skip, weaken, or silently rewrite tests to meet a speed target.
2. **Evidence over hype.** Never promise 10x or 100x. Differentiate cold, warm, incremental, selected, and complete uncached timings. Report conditions and variability.
3. **No false green.** Selected or cached tests are not equivalent to a complete suite unless the repo's validated gate explicitly defines and proves that equivalence. Unknown impact expands verification, never shrinks it.
4. **Real boundaries still get tested.** Pure-core or contract tests complement but never replace required database, OS, network, browser, GPU, device, authorization, payment, and end-to-end checks.
5. **Deterministic by construction.** Prefer injected clocks, seeded randomness, controlled scheduling, stable fixtures and isolated state. Forbid reliance on test order and unspecified global mutable state.
6. **Cache only validated purity.** Key results by relevant source, transitive dependencies, toolchain and lockfile, config, flags, environment, runtime/platform, and fixture inputs. Invalidate on missing inputs; do not cache nondeterministic, secret-sensitive, externally stateful or flaky work as trusted PASS.
7. **Concurrency safely.** Parallelize independent tests; give workers isolated resources, database namespaces, ports, files and service instances. Measure contention and memory pressure. Do not turn races into passing tests.
8. **Do not install global tooling, change security gates, use paid CI, trigger expensive cloud runs, or modify unrelated suites without authorization.** Preserve local user work.

## Workflow

### 1. Discover the actual verification contract

Read AGENTS.md and repo-specific docs, test scripts, workflows, coverage rules, release requirements, and prior regression history. Enumerate test frameworks and workloads. Record exact ref, environment, platform, CPU, available resources, tool versions and command lines where accessible.

For **Blueprint**, classify architectural risks and write a test plan before code. For **Rescue**, first collect a baseline without changing test behavior. For **Author**, establish what a correct failure would look like before implementing tests.

### 2. Profile the right clock

Measure **CPU time and spawn count** per test file first: they are properties of the code, identical on an idle laptop and a machine at load 700. Wall time is the developer's outcome but a noisy instrument; under load it measures the neighbours, so take wall readings only on a quiet machine and report the load beside them.

The **harness is code under test too**. Profile the runner, its watchers, reporters, admission/slot logic and CI wrappers the same way. A runner or watcher that polls by spawning `ps`, `git` or a shell every few hundred milliseconds can cost more than every test it runs.

Distinguish:
- dependency resolution and build/compile;
- collection/discovery and process startup;
- test logic;
- fixture creation, database/network/filesystem calls;
- wall-clock waits, sleeps, retries and polling;
- teardown, logging/reporters, browser/device launch;
- queued jobs, CI overhead, serialization and agent contention.

Measure representative **cold complete**, **warm complete**, and **edit-affected feedback** separately. Where practical, repeat matched commands and report medians, spread, test count, relevant runner/cache state and flaky failures. Baselines without executed commands are hypotheses only.

Read [measurement contract](references/measurement-contract.md).

### 3. Establish cheap, meaningful execution seams

Prefer a pure deterministic domain core with explicit adapters around clocks, RNG, network, files, persistence and platform services. Test business invariants through direct functions/state machines when possible, without starting the entire application. Do not simulate so much that the test proves only the mock.

Design tiers:
- **Micro**: pure unit, parser/state-transition, table-driven, property-based and metamorphic tests; target immediate local feedback.
- **Component/contract**: real module APIs, protocol schemas, boundary behavior and focused persistence or service behavior.
- **Integration**: real external adapters under isolated controlled environments.
- **End-to-end/system**: real UI/device, critical workflows, production-like wiring and release concerns where applicable.

Favor high-value test oracles, boundary cases and invariant coverage over massive case counts. Where safe, run thousands of input cases in one process rather than repeating expensive global setup. Property/fuzz tests must record seeds and reproduce counterexamples.

### 3a. Author mode: write on the cost ladder

Each line of a test sits on a rung of the **cost ladder**. Write every line on the lowest rung that still proves the requirement:

| Rung | Typical cost | Cheaper rung that keeps the proof |
|---|---|---|
| real network, browser, device | 100 ms – s | recorded payload into the parser; one real gate in its own tier |
| real wait: sleep, timeout, retry, poll | its full duration | injected clock or fake timers; advance time explicitly |
| **process spawn** (child runtime, `git`, shell, `ps`) | 5 – 50 ms each, far more under load; on macOS each exec also pays a code-signature check | call the function in-process; inject the spawner and assert the argv it received; build any repo fixture once per file, or feed the parser the text `git` would print |
| server start, port bind | ms plus flake risk | call the handler with a request object; one server per file when the socket is the subject |
| temp dirs, file writes | 0.1 – 1 ms each, more with file watchers | in-memory seam for the file API; one temp root per file |
| module import, runtime cold start | 10 – 100 ms | one process runs every case in the file |
| large fixture parse | grows with size | the minimal fixture that triggers the case; parse once per file |
| pure function on in-memory data | µs | where the test belongs |

Typical costs are orders of magnitude for planning; your measurements replace them. When the subject *is* the boundary (spawn semantics, signals, sockets, real git behaviour), keep the real call and give it a reason comment; that is a real-boundary test (invariant 4), and it lives in a tier sized for it.

**Done** for a written test means: the new test goes **red** against the defect it guards (or a deliberate mutation), and its CPU time, spawn count and real waits are read and inside the budget, or carry a reason per costly line.

### 4. Optimize in descending order of impact

1. Eliminate unnecessary work (duplicate test execution, excessive setup, actual waiting).
2. Share immutable fixtures; isolate mutable fixtures.
3. Move pure logic out of expensive runtimes when the production architecture permits it.
4. Use correct incremental rebuilds, targeted change-impact selection and appropriate parallelism.
5. Use trusted local or remote caching for deterministic matching inputs.
6. Profile algorithmic/memory bottlenecks within tests only after larger overhead is addressed.
7. Tune reports, fixture sizes and tools without sacrificing diagnostic detail or assertion strength.

Always compare one controlled intervention against the previous baseline. If a 'speedup' only moved a critical check out of the measured set, label it a change in verification scope, not equivalent acceleration.

### 5. Make the verification matrix explicit

Define project-specific gates, starting from the budgets above, and enforce them with a guard that fails the build when a file exceeds its budget:
- edit loop: affected tests + cheap invariant checks;
- pull request: affected suites, contract/integration coverage for changed boundaries, static analysis and mandatory security/regression gates;
- merge/release: repo-defined comprehensive verification (full uncached where required);
- recurring: complete matrix including slow E2E, platform variants, fuzzing and flake detection as justified.

Cross-cutting changes (toolchain, shared configuration, schemas, core contracts), missing graph edges, unknown dependencies and suspected flaky tests should conservatively expand scope. Never classify a skipped job as PASS. Independently validate test-impact selection against periodic full-suite results and track misses.

### 6. Fleet mode

Represent each test execution with its exact source revision, command, environment and immutable inputs. De-duplicate identical authorized work across agents, schedule CPU, memory and spawn-rate budgets per machine, shard by measured CPU time, and isolate side-effectful workers. When many agents share one machine, the machine-wide spawn rate is the first reading: one agent's polling loop or several concurrent suites can starve every verdict. Cache artifacts/results only with provenance and trustworthy keys. If an agent's result is stale or inputs differ, rerun. Keep centrally enforced full-verification gates separate from fast exploratory verdicts.

### 7. Verify the optimization

Before claiming success:
- run the original regression cases and required gates;
- run new or modified tests against deliberately defective behavior or mutation tests when feasible, so assertions are demonstrated to fail;
- examine skipped, deselected, retried and quarantined counts;
- compare identical verification scope under matched conditions;
- record correctness risks and any CI gates not executed.

A local test run cannot certify coverage of unsupported platforms or external providers.

## Output contract

Deliver one concise **Test Velocity Plan / Evidence Record**:
- repo, ref, mode, risk and execution environment;
- observed commands and baseline timing split (or explicitly 'not measured'), with CPU time and spawn count per file for the heaviest files;
- bottlenecks ordered by measured contribution;
- selected architectural changes and rejected alternatives;
- test tiers and exact required verification gates;
- change-selection/cache invalidation and fallback rules;
- before/after cold, warm and affected-run times for equivalent scope; also test counts and flakiness;
- what was actually run, remaining risk, and next highest-value action.

Do not claim the skill itself enforces CI. Only working project configuration, executed checks and logs constitute enforcement.

See [stack recipes](references/stack-recipes.md) and [measurement contract](references/measurement-contract.md).
