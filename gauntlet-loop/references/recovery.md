# Tool capability detection and autonomous recovery

The fact that one browser invocation failed does **not** mean real verification is technically impossible. Diagnose the cause, vary strategies and stay inside task authorization.

## Recovery ladder

1. **Read the failure and context.** Capture failing tool/executable, stderr/exit, current repo revision, host OS, executable versions, profile path and sandbox limits when actually available. Do not guess missing facts.
2. **Check obvious configuration:** wrong browser binary, stale cached profile, Playwright path, command quoting, unsupported flags, permissions, server port conflict, network URL, missing dependencies, canvas/WebGL availability.
3. **Try isolated configuration:** fresh temporary browser profile/user-data-dir, clean temp cache, ephemeral local server, known suitable executable and correct working directory. Do not erase someone else's profile or state.
4. **Try appropriate alternative implementation:** another **actually installed and suitable** full browser, project-native screenshot/test harness, offscreen renderer, native application export, frame capture, browser-capable coding tool, local desktop/emulator. Compare coverage and note lost fidelity; a DOM parser is NOT equivalent to Canvas/WebGL screenshot.
5. **Install safe free dependencies only if scoped:** temporary/project-local genuinely free packages/browser runtimes; obey host sandbox and user consent. Do not modify tracked lockfiles/global settings without authority. Avoid paid or credit-burning fallback services.
6. **Handoff if truly necessary:** when no authorized path covers a critical requirement, preserve the current best candidate, attempted options, specific error, last passed gates and one exact runnable step in an environment that has the missing capability. Mark required gate NOT_RUN, and verdict BLOCKED_ENV or BLOCKED_PERMISSION.

Never loop the same failed command without a changed hypothesis. Research errors if tool/network access and security policy permit. A target-specific integration missing from an environment may need a local coding agent, but an agent must not claim it ran that environment if it didn't.

## Approvals and hard boundaries

Autonomous without repeated questions (where the task's scope permits):
- choose alternate *read-only* inspection strategy;
- create a temporary isolated browser profile;
- run free local tests and capture evidence to an ignored/private directory;
- repair session-local environment setup;
- install genuinely free local/project-isolated tooling without tracked side effects.

Require explicit approval:
- system-wide/global package and service installation;
- elevated/admin privileges, security setting disablement or host policy bypass;
- paid services, credits, license purchase or new accounts;
- access to secrets, credentials or unauthorized private systems;
- destructive cleanup or overwrite of source/project state;
- pushes/deployments/network side effects beyond the scoped task.

If an authorized free local setup is impossible because the *actual* environment is read-only or sandboxes tool access, report the limitation honestly. Never silently skip verification and label PASS.

## Progress, retries and plateau

A practical loop is not infinite. After two materially different attempts without improvement, **re-diagnose**, change strategy, split the problem into lower-level checks and retry if useful. If time or resource quota expires, use PAUSED_RECOVERABLE, not PASS. If fundamentally different approaches still show no progress and all authorized alternatives are exhausted, record PLATEAU_UNRESOLVED with options. Do not interpret a fixed three attempts as completion. If improvement remains measurable, continue within the user-approved budget and actual available time.

## Checkpoint template

~~~text
GOAL            user requirement / reference
ARTIFACT        best version ref, location and saved changes
OBSERVED        genuinely inspected screenshots/frames/tests, and conditions
PASSED          critical gates already proven at which revision
MISSING         failing or not-run critical gates
ENVIRONMENT     host, binaries/profiles actually tried, exact errors
ALTERNATIVES    what else was attempted; why coverage does/doesn't match
NEXT            exact step to try, with permission state
VERDICT         PAUSED_RECOVERABLE / BLOCKED_PERMISSION /
                BLOCKED_ENV / PLATEAU_UNRESOLVED
~~~

Resuming should use the checkpoint, not restart repo discovery from scratch. Recheck a previously passed gate only if relevant code changed.
