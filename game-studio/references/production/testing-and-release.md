# Optional PLAYTEST / ITERATE / QA / PRODUCTION protocol

## Evidence collection

Capture version/commit, input sequence, observed state changes, screenshot or frame hashes when used, device/render conditions, participant (human, agent self-review, automated test), scenario, defects and reproducible next check. Do not give automated bots a human enjoyment score. A passing test on the loop's data model cannot certify that the player understands the feedback.

## Scenario family

- **First minute:** blind reader/player identifies visible objective, first physical input and resulting change. Separate UI hesitation from shallow agency.
- **Two-action fork:** verify alternative choices produce different costs and future states; look for dominant strategy and false choice.
- **Five-minute repeated play:** inspect evolving pressure, strategy switching, no-op repetition, resource depletion and recoverability.
- **Setback/restart:** test fairness of feedback, invalid actions, accessible retries and preserved or reset progression.
- **Upgrade and world change:** ensure unlocks modify options and encounter patterns rather than adding only numerical speed.
- **Regression:** previously passing input, save/load, rendering, progression, onboarding and performance checks after each change.

## Design iteration

Compare the observed behavior against the baseline hypothesis and constraints; log reason for each revision. When a new mechanic confuses players, test whether changed UI cues repair it *without changing the core rule* before discarding the mechanic. If a strategy remains dominant, alter opportunity costs and retest, not just visual polish. Maintain a recoverable best-known candidate.

## Production boundary

Only when explicitly authorized: inspect actual build pipeline, assets/licenses, account permissions, release targets, performance, crash logs, telemetry consent, accessibility, save migration, localization and user data/online service risks. List untested platforms and risks; do not launch, pay, access credentials or modify production infrastructure implicitly. Independent security/performance reviews are helpful when available, not fabricated prerequisites. Any handoff includes precise repo state, setup, tests, blockers and next command.
