# Agent-native operator UX: make responsibility, evidence and control visible

Read for multi-agent workspaces, development cockpits, automation dashboards, workflow canvases, human/agent coediting and long-running tasks. Do not apply this complexity to an ordinary product form or static website.

## Show whose work and which truth

A human, coordinator, worker, reviewer, external provider and CI runner are distinct actors. Visually separate **intent**, **claimed execution**, **observed activity**, **independent verification**, **approval**, **landed output** and **deployed/live result**. Do not collapse these into a single green success icon.

Minimum task strip, when relevant:

- **Goal:** what the task is for, not just the last agent message.
- **Owner:** which agent or person can actually act next.
- **State:** queued, claimed, running, waiting, blocked, rejected, verified, approved, integrated or live. Use project-specific canonical names.
- **Evidence:** last meaningful receipt, timestamp/identity and what it proves.
- **Next action:** retry, reassign, inspect, approve, take over, undo or archive, only when genuinely supported.

Do not invent ETA, percent complete, model quality or a passing test. When a sensor is stale or unreadable, show that condition rather than silently preserving its previous green status.

## Collaboration and task decomposition

Treat a shared agent conversation as a coordination surface, not as the authority for file changes or permission grants. A useful handoff carries goal, scope, limits, acceptance conditions, relevant pointers, expected artifact and named return path. Preserve who authored the answer. A delegated response should not be paraphrased as the requesting agent's own work.

A person should be able to scan one active task, then expand into its subthreads without loading all specialist chatter. Maintain one recognizable task identity across a list, thread, workflow node, activity feed and final artifact. Show independent tasks concurrently only when the workspace can support that concurrency; otherwise make queued/held reasons visible.

Use a reversible, reconstructable account of significant actions. A UI activity feed is an observation, not a substitute for the real task/evidence/event store. Include causality when useful: which task led to which command, which command produced which artifact, and which verifier accepted or refused it.

## Takeover and interruption

For live browser or terminal work, separate **watching** from **controlling**. The user needs an explicit control transfer that names the target agent/computer, freezes or refuses conflicting agent input while owned by the human, and clearly returns control. Secret entry must not appear in ordinary transcripts. An approval, an ordinary text reply and an administrator tool grant are different kinds of authority.

Design restart, offline, browser login, background-routine failure, missing provider allowance, cancelled run and partial evidence as first-class states. Preserve drafts and durable work. Quiet autonomous routines should report material outcomes without flooding the primary conversation; failures remain discoverable in a stable place.

## Adaptive composition

A Build view may foreground diff, tests, task owner and CI evidence; a Visual view may foreground preview and before/after inspection; a Board view may foreground relationship and parallel work. Recompose emphasis according to active decision, but do not lose an important blocker or pending approval merely because the display changed modes.

Keep one primary status signal per active workstream; use richer detail on demand. Permit compact operator density without mandatory nested cards. Give each visual region the role described in [surface grammar](surface-grammar.md).

## Review probes

1. Can a person distinguish **working**, **finished producing output**, **independently verified**, **merged** and **deployed** in one glance?
2. Can the person identify the next responsible actor and safely interrupt or reassign?
3. Can the person reach a failed task after the toast disappears, across devices and after restart?
4. Does the same task show consistent identity and state across board, chat, browser, mobile and notifications?
5. Does taking over a browser/terminal disable competing agent input and restore clear control afterward?
6. Do screen-sharing, logs and screenshots avoid exposing secrets or claiming permissions they do not possess?

Observe actual behavior at real build revisions when possible. Interface sketches, docs and mock receipts are not proof of a deployed operating system.
