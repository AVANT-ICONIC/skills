# Optional SPEC bridge: design contract to implementation

Only load when SPEC, PROTOTYPE, BUILD, or another explicitly production-oriented mode is authorized. For ideation, this is not a required output. Existing project instructions, canonical GDD, OpenSpec schema and repository constraints take precedence over generic templates; do not create parallel specs that contradict them.

## D19: GDD author, on demand

Keep a living **trace** between promised player action and implementation. Minimum sections: goal/pillars; camera and exact input mapping; state variables; core transitions; success/failure; two context-dependent strategies; progression/world effects; presentation/feedback; technical dependencies; unresolved risk; executable acceptance conditions. Fold content into existing approved design docs instead of generating a massive static book. Mark normative behavior versus aspirations and ask only for material missing decisions.

**Example requirement:** “With 1 beam remaining, pressing E on a repairable tile consumes it, visibly opens that passage and prevents a second repair until another beam is recovered.” Negative acceptance: no beam → no consumption, clear feedback, no ghost path. That is more useful than “add immersive bridge mechanics.”

## D21: Technical design bridge, implementation contract

Trace each verb through **input source → validation → state transition → event/save layer → renderer/audio/UI → regression check**. Confirm actual engine/framework, APIs, dependency versions, platform and licenses before proposing exact adapters. Prefer installed project architecture over unverified substitutes. For async or multiplayer, specify authority, ordering, latency reconciliation and rollback only if the task needs them. For mobile, budget focus and touch gesture conflicts; for WebGL/Pixi/Canvas, verify the real rendered output, not an empty canvas element.

Before a change: inspect repository permissions and dirty state; pin base commit, branch/isolated folder, artifact, executable test and rollback. **No destructive reset, secret reading, paid network services, engine rewrite or deployment without approval.** After a change: run unit and integrated runtime tests, inspect actual state/visuals where permitted, log what was and was not tested.

## Portability matrix (advisory until tested)

- Browser/HTML/Canvas/WebGL: verify current DOM inputs, render loop, pixel/draw evidence and client/server origin. Syntax of a helper is not proof of screenshot fidelity.
- PixiJS/Godot/Unity/Unreal: inspect exact installed engine version and project conventions; map inputs/state/rendering into existing nodes/scenes/components. No claim of verified API bindings without execution.
- Desktop/native/mobile/Tauri: confirm lifecycle, threading, device/controller mapping, save ownership and build targets. No global toolchain installation assumed.

Use this as a *question map*, not a claim each adapter is fully integrated or tested.
