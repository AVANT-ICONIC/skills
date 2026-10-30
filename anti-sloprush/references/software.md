# Software, runtime and interaction QA

Code review alone is insufficient when user requested working behavior.

1. Lock requirements and user-owned state. Inspect relevant repository state and native test commands.
2. Run appropriate fast static checks and actual tests/build. For visible changes render in a *real* suitable browser/app runtime and open screenshots at relevant breakpoints/states.
3. Exercise critical clicks, keyboard, focus, error/empty/loading states, persistence where required, network failures and real end-to-end paths. A no-console-error page is not proof it works.
4. Test changed behavior and integration/regression risk. Include negative/edge cases; don't weaken tests to achieve green.
5. If a visual reference exists, compare real render against that reference and inspect unintended drift. Protect source graphics; don't silently replace assets with generated approximations.
6. After edits rerun actual verification against the changed revision; record commands and exit status honestly.
7. For regressions and architecture, compose with `architecture-guard` and `gauntlet-loop` rather than copying their rules.

Do not mark PASS when crucial checks only exist as proposed commands. State NOT_EVALUATED, the limitation and next runnable check.
