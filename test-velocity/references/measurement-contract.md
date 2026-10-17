# Measurement and evidence contract

## Baseline

Record repo URL and commit, clean/dirty state, exact commands, runner version, lockfile, OS/arch, CPU and memory, concurrency, cache state and whether a remote CI service was involved. If unavailable, mark unknown rather than estimating.

Use at least two repetitions for exploratory timing and more when variance is substantial; median alone is not proof of stable improvement. A first cold build and a restored-cache run are different experiments. Measure runner startup, compile, discovery, fixture setup, test execution, teardown, queueing, retries and reporting when tools allow. Wall time is the primary developer-feedback outcome.

## Comparable measurements

- **Cold complete:** fresh build/test cache, same dependency cache policy both sides, all required tests.
- **Warm complete:** repeat of exact full command after warmup; note permitted test result reuse.
- **Affected edit:** identical representative edit and dependency state, selected tests and all mandated complementary gates.
- **CI wall clock:** queue + jobs + artifact/retry overhead, distinguished from summed CPU time.
- **Fleet throughput:** independent trustworthy change verdicts per hour under fixed machine/budget constraints, not raw jobs launched.

Compute speedup only as baseline seconds divided by optimized seconds **for equivalent work**. If changed tests, conditions, platforms, retry policy, cache correctness or coverage differ, do not report the quotient as equivalent speedup. Report selection-based feedback improvement separately.

## Evidence record template

- Scope: project / commit / mode / owner
- Verification contract: required test families and gates
- Conditions: command, environment, flags, cache, concurrency, fixtures
- Baseline: cold / warm / affected / test counts / flaky or retry counts
- Dominant overhead: observed timings and instrument used
- Change: what altered; what was intentionally preserved
- Validation: tests executed, failures deliberately detectable, selection-fallback checks
- Optimized: cold / warm / affected and same counts
- Result: measured improvement or unverified hypothesis
- Risks: missing platforms, unverifiable dependencies, flaky/quarantined work, cache trust
- Follow-up: bounded next experiment with falsification criteria

## Stop conditions

Stop a proposed optimization when it weakens assertions, depends on undocumented cache validity, changes behavior to suit tests, masks timing flakiness, requires unsafe shared state, or fails to improve matched wall-clock time enough to justify its maintenance cost.

A dramatically faster selective run does not excuse hiding a slow but mandatory full gate.
