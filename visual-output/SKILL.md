---
name: visual-output
description: Portable presentation companion that makes agent responses highly visual, compact, and easy to scan using semantic status markers, progress bars, ASCII/Unicode structure, diagrams, tables, and operator-style summaries without altering exact artifacts. Use alongside another skill when presentation quality matters.
compatibility: "Portable across Agent Skills runtimes that can render Markdown and plain Unicode text. No external tools required."
---

# Visual Output

Make user-facing output visually structured by default.

This is a **presentation companion**, not a task skill. It changes how results, progress, state, options, and conclusions are presented. It must not change the underlying task semantics, evidence, code, files, specifications, commands, or other exact artifacts.

## Core rule

Prefer visual structure whenever it communicates faster than prose.

```text
state → structure → detail
```

A user should be able to skim the response and understand:

1. what is happening;
2. what is done;
3. what matters;
4. what is blocked;
5. what happens next.

Do not bury those answers inside paragraphs when a visual structure would make them obvious.

## Semantic visual language

Use a stable legend:

- 🟢 complete, verified, healthy, success
- 🟡 active, partial, attention, uncertainty
- 🔴 blocked, failed, critical risk
- 🔵 fact, evidence, information, inspection
- 🟣 decision, creative branch, hypothesis
- ⚪ neutral, pending, background
- ⚫ deferred, intentionally inactive

Use other emojis only when they add semantic meaning. Decoration without information is noise wearing a party hat.

## Preferred building blocks

Use a rich mix when useful:

- semantic emoji markers;
- color circles;
- progress bars such as `██████░░░░ 60%`;
- stage indicators such as `●●◐○○`;
- ASCII and Unicode boxes;
- separators such as `━━━━━━━━━━━━━━━━━━`;
- trees and dependency diagrams;
- pipelines and flow diagrams;
- compact dashboards;
- aligned status rows;
- timelines;
- matrices;
- comparison tables;
- concise success/failure feeds.

For substantial responses, distribute visual anchors through the answer instead of placing one decorative header at the top and then returning to a wall of text.

## Information hierarchy

Prefer this order when applicable:

```text
╭─ CURRENT STATE ────────────╮
│ what matters right now     │
╰────────────────────────────╯
            ↓
      key findings
            ↓
      decisions / risks
            ↓
       supporting detail
            ↓
        next action
```

Lead with the state the user needs to act on.

Do not bury blockers below background explanation.

## Progress

Use **one dominant progress indicator per workstream**.

Good:

```text
BUILD   ███████░░░ 70%
```

Do not invent precision.

If progress is not objectively measurable, use stages:

```text
DISCOVER  ●
DESIGN    ●
BUILD     ◐
VERIFY    ○
SHIP      ○
```

Meanings:

- `●` complete
- `◐` active
- `○` pending
- `×` blocked or failed

Several percentages are acceptable only when they represent genuinely independent workstreams.

## Compact operator panels

For ongoing work, prefer dense status panels with short labels and stable alignment.

```text
╭─ STATUS ─────────────────────────╮
│ 🟢 repo      synced              │
│ 🟢 spec      loaded              │
│ 🟡 build     ██████░░░░ 60%      │
│ 🔵 tests     18 passed           │
│ 🔴 blocker   none                │
╰──────────────────────────────────╯
```

The terminal influence is about **clarity, density, and alignment**. Do not pretend the response is a shell unless it actually is one.

## Ownership separation

When several actors or systems are involved, make ownership explicit.

```text
USER     → decides scope
AGENT    → performs task
TOOL     → gathers evidence
REPO     → durable source of truth
CI       → verification
```

Or:

```text
👤 USER
  └─ decision

🧠 AGENT
  └─ execution

🔧 TOOL
  └─ evidence
```

Do not blur:

- user decisions;
- agent interpretation;
- tool output;
- repository truth;
- verification evidence.

Presentation must not create false authority.

## Process diagrams

When explaining a workflow, architecture, dependency, or handoff, prefer a small diagram before long prose.

```text
input
  ↓
inspect
  ↓
decide
  ↓
execute
  ↓
verify
```

Use branching when the process actually branches:

```text
          ┌─ success → continue
check ────┤
          └─ fail    → repair → recheck
```

## Comparisons

Use tables for genuinely comparable dimensions.

Use trees for hierarchy.

Use flows for sequence.

Use timelines for chronology.

Use matrices when two dimensions interact.

Use plain prose when nuance would become harder to understand in a diagram.

Do not convert everything into a table merely because Markdown technically permits this crime.

## Long-running work

For multi-step work, expose periodic visual checkpoints.

```text
━━━ CHECKPOINT ━━━━━━━━━━━━━━━━━━━━━

🟢 discovered
🟢 designed
🟡 implementing
⚪ verification

███████░░░ 70%
```

Each checkpoint should communicate a changed state. Do not repeat the same dashboard after every tiny operation.

## Final answer shape

For substantial completed work, prefer a compact result-first structure such as:

```text
╭─ RESULT ───────────────────╮
│ 🟢 primary outcome         │
╰────────────────────────────╯

key changes / findings

━━━ EVIDENCE ━━━━━━━━━━━━━━━━
verification / source state

━━━ STATE ━━━━━━━━━━━━━━━━━━━
branch / PR / artifact / remaining boundary
```

Do not force this exact template when another structure fits better.

## Artifact boundary

Visual formatting applies to **presentation around exact artifacts**, not inside them.

Do not decorate or alter:

- source code;
- shell commands;
- JSON or YAML;
- SQL;
- prompts intended for another agent;
- specifications;
- file contents;
- emails or messages being drafted;
- quoted text;
- exact data;
- copy-paste payloads.

Bad when an exact command is required:

```text
🟢 npm install package ✅
```

Good:

```text
🔧 Install
```

followed by the exact untouched command.

## Density calibration

Match visual density to task size.

### Tiny answer

Use one or two semantic markers at most.

Do not erect a command center to answer a one-line question.

### Medium answer

Use headings plus several useful visual anchors such as a status row, mini-table, or simple flow.

### Large or multi-step answer

Use stronger hierarchy throughout:

- opening state;
- progress or stage visualization;
- diagrams where relationships matter;
- compact tables;
- clear final state.

The goal is **scanability**, not maximum ornament count.

## Accessibility and robustness

Do not rely on color-circle meaning alone. Pair color with words or symbols.

Prefer simple Unicode that survives copy/paste.

Keep diagrams understandable in monospace.

Avoid oversized decorative banners that dominate narrow terminals or mobile screens.

If the runtime renders emoji poorly, fall back to textual labels and ASCII markers.

## Composition

This skill is designed to combine with another task skill.

```text
task skill       = what to do
visual-output    = how to present it
```

Examples:

```text
futurequake + visual-output
seo-aiseo   + visual-output
intent-mode + visual-output
```

The task skill remains authoritative for domain behavior and required output contracts.

If another active skill requires an exact output shape, that requirement wins.

## Portability rule

Do not depend on:

- a specific chat UI;
- WebUI-only metadata;
- proprietary widgets;
- runtime-specific rendering APIs;
- terminal escape codes;
- hidden CSS;
- a particular model vendor.

Markdown plus plain Unicode is the baseline.

## Non-goals

This skill does not:

- force a terminal aesthetic on every response;
- require emojis inside exact artifacts;
- replace task-specific output formats;
- invent progress percentages;
- add fake confidence indicators;
- change task semantics;
- create execution authority from presentation;
- make a simple answer longer merely to satisfy a visual quota.

## Completion

Visual Output is being followed when the response:

- exposes important state early;
- uses visual structure where it improves comprehension;
- keeps status semantics consistent;
- distinguishes ownership and evidence clearly;
- avoids fake precision;
- preserves exact artifacts unchanged;
- remains understandable when copied into a plain-text or terminal environment.
