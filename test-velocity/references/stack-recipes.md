# Stack-specific recipes (adapters, not universal prescriptions)

First inspect existing versions, docs, build scripts, CI and team constraints. Use installed tooling and avoid migration for speculative gains.

## Go

Keep pure package tests small and table driven; use subtests and fuzz cases where valuable. Go's test cache reuses eligible successful package test runs; check actual flags and environment dependencies before relying on it. Beware forcing uncached runs with -count=1. Use -run for focused development and targeted benchmark commands; isolate any process/global state before -parallel or t.Parallel.

## Rust

Separate fast unit/integration contract tests from slower real-service and environment tests. Review Cargo incremental compilation and features/workspace dependency graph. Consider cargo-nextest when available for isolation, concurrency, reruns and CI partitions; don't assume it automatically offers correct source-change impact selection. Snapshot and property testing need deterministic inputs and stable diagnostics. Track cold compilation distinct from runtime.

## Swift / Apple platforms

Put independently testable logic in Swift packages and inject clocks, persistence and platform adapters. Keep UI and real iOS/device/StoreKit integration tests as genuine platform gates, not replaced by host-only mocks. Measure simulator launch and test-host reuse separately. Test matrix should distinguish macOS-hosted package tests from iOS and device execution.

## TypeScript / JavaScript

For appropriate repos, consider Bun or Vitest for low startup cost and watch/related modes. Keep pure units out of browser/UI bootstraps. Use Playwright selectively for critical real-browser behavior and shard only when independent. Nx/Turborepo/Bazel-like dependency-aware execution may help monorepos; hash inputs and environment honestly. Never trust an affected graph without checking transitive/config edges and full-suite audits.

## Python

Use pytest parametrization, process/fixture scope with caution and profile import/collection cost. pytest-testmon can select affected tests based on collected runtime dependency information, after establishing its baseline; check its limitations. Consider pytest-xdist only when tests are safely isolated and startup is not dominant. Mock real time; do not assume CPython runtime is the key wall-clock bottleneck.

## Games, rendering, native systems

Extract deterministic gameplay and state machines into headless simulation cores. Add golden/replay tests for physics/state invariants with stable seeds and tolerance policies. Keep real engine, GPU, renderer, sound, memory, and device tests as separate observable gates. For native/security code, retain real OS syscall, socket identity, permission, file and process-boundary tests even if pure checks are fast.

## Relevant official/primary references (reverify before installing)

- Go test runner and cache: https://pkg.go.dev/cmd/go#hdr-Test_packages
- cargo-nextest: https://nexte.st/docs/
- Swift Testing: https://developer.apple.com/documentation/testing/
- Vitest: https://vitest.dev/guide/
- Bun test runner: https://bun.sh/docs/test
- Nx affected and caching: https://nx.dev/docs/features/run-tasks and https://nx.dev/docs/features/ci-features/remote-cache
- Bazel remote caching: https://bazel.build/remote/caching
- pytest-testmon: https://www.testmon.org/
