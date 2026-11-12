# Planar rigid-body pose core v1

**Status:** Experimental SE(2) constraint solver, audit-only. Not a physics, collision or force solver.

## Purpose

Existing analytic slider-crank and four-bar graph models are independently audited by point-distance constraints. The new core independently tests the **orientations and translations of entire rigid bodies** and their common pins. It does not replace production film or interactive rendering.

Schema: `avant.rigid-pose-constraints/1`. Each body is fixed with a known pose `(x,y,theta)` or free with an explicit seed pose. Supported joints are:

- **Revolute:** two local anchors must occupy the same world position (two length residuals).
- **Prismatic with fixed reference:** the moving anchor remains on the fixed oriented guide and its body angle remains aligned (two residuals).

The solver uses analytic rotation derivatives, a damped least-squares Jacobian, bounded root iterations, rank detection and explicit initial seeds. Results: `closed`, `singular`, `underdetermined`, `unresolved`. Failure to converge is NOT proof of impossible geometry. No user-supplied scripts or expressions are evaluated.

## Assembly branches

`enumerateRigidPoseBranches` accepts multiple explicit seed sets and clusters distinct solutions by caller-specified body-local markers. It returns `globalCompletenessProved=false`. The reviewed four-bar adapter supplies separate open/crossed seed estimates, but the generic solver knows nothing about named mechanical types. There is no history-dependent branch switch.

## Tests and evidence

- 12 local Node tests: 360-degree slider-crank and two-branch four-bar, exact independently computed positions, repeated arbitrary-order time seeking, branch enumeration, SE(2) coordinate-system invariance, singular tangent Jacobian rank, adversarial malformed joints, underdetermined and incompatible constraints.
- Audit adds an independent rigid-body proof across 33 slider-crank and 66 four-bar poses, in addition to the earlier independent point-distance proof.
- The package validator requires a separate numerical receipt (`avant.independent-rigid-pose-proof/1`) with measured position discrepancy and tolerance, and rejects an absent/forged receipt even when file hashes are updated.
- Geneva pin-slot mechanics remain `NOT_EVALUATED` by this new solver.
- The viewer and deterministic video remain driven by the established analytic models; full Chromium/FFmpeg CI must still pass for any edited revision.

## Limitations

The bounded local solver does not prove global branch enumeration, force balance, collision-free motion, physical stiffness, bad-seed convergence, arbitrary moving prismatic references or 3D CAD accuracy. Singular and near-singular configurations require careful tolerances; a nearly closed numerical root is not physical certification. Linked technical source URLs are not automatically retrieved. Hardware GPU, OS isolation and source-rights verification remain pending. All packages retain `releaseReady=false`.

Run: `node --test mechanism-studio/tests/rigid-pose.test.mjs` followed by existing model-audit and Chromium CI checks. The sole owner is `scripts/rigid-pose-core.mjs`; `rigid-pose-adapters.mjs` maps reviewed graph data to it. No third solver copy per machine.
