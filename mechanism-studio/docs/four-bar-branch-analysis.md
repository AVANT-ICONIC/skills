# Four-bar linkage: dual-branch mechanism study (MM-003)

**Status:** Experimental, reference-linked, ideal kinematic model. Not a physical engineering certification.

## Geometry and the real problem this solves

A planar RRRR four-bar has four rigid links: **ground** (d), **input crank** (a), **coupler** (b) and **output rocker** (c). All four are connected by revolute joints. The input pin at P₂ = a(cos θ, sin θ) lies on one crank circle. The coupler end P₃ must simultaneously lie on a circle of radius b around P₂ **and** a circle of radius c around the output ground pivot O₄ = (d,0). A valid assembly is one of the circle intersections.

Those intersections yield **two distinct configurations**. We label them `open` when the oriented cross product of (O₄−P₂) and (P₃−P₂) is positive, `crossed` when negative. These are mathematical branch labels, **not** guarantees about real link interference or whether a user can physically reassemble between branches.

The solver evaluates absolute input angle directly. It has no previous-frame state and reports:
- `closed`: either branch satisfies all four link lengths, with numerical closure residuals.
- `unreachable`: circles do not intersect and no physical assembly exists at this input angle.
- `singular`: circles are tangent, both branches coincide and the output velocity ratio is undefined; no silent branch switch.
- `ambiguous`: coincident circle centres cannot determine a unique assembly.

Sample dimensions in millimetres: ground 120, input 35, coupler 110, rocker 90, speed 12 RPM. These values are **illustrative assumptions**, not extracted measurements. The sample is a strict Grashof full-turn crank-rocker, with no toggles over a 360° driver cycle.

## Numerical design

Given v = O₄−P₂, e=|v|, ê=v/e:

- Circle centre distance: e.
- Coupler foot along centre line: x=(b²−c²+e²)/(2e).
- Perpendicular intersection height: h=√(max(0,b²−x²)).
- Output joint: P₃=P₂+x ê ± h perp(ê).
- The sign selects a branch without retaining a stateful branch flag.
- Circle intersection exists only for |b−c| ≤ e ≤ b+c.
- When h approaches zero (or the equivalent angular Jacobian determinant approaches zero), flag a singular/toggle configuration instead of asserting a finite output angular velocity.

The full-rotation **viewer** requires strict inequalities at every input angle, so it rejects a brief that cannot close continuously. The **diagnostic solver** still returns explicit unreachable/toggle states for invalid/edge-case mechanisms. These separate interfaces prevent an animation from implying that an impossible assembly rotates continuously.

## Source grounding

- [University of Illinois Dynamics Reference, Four-Bar Linkages](https://dynref.engr.illinois.edu/aml.html): planar rigid links, single degree of freedom, crank-rocker construction.
- [Fourbar Linkage, Chapter 2, position analysis](https://www.cs.vu.nl/~eliens/assets/document/ch/chmechanism.pdf): vector-loop equation r₂+r₃=r₁+r₄.
- [UC Berkeley dissertation on linkage singularities and Jacobian](https://escholarship.org/content/qt39x2q3b8/qt39x2q3b8_noSplash_f57b37534e122cf3f76ef3e70af2df02.pdf): singular stationary configurations and continuity/branch tracking.

Source URLs are registered as links only. The compiler does not download or independently verify their contents, and no external imagery is copied. The geometric equations were independently implemented and numerically tested.

## Reproducible workflow

~~~bash
node --test mechanism-studio/tests/fourbar-solver.test.mjs
node --test mechanism-studio/tests/mechanism-graph.test.mjs

node mechanism-studio/scripts/compile-request.mjs \
  --request mechanism-studio/requests/four-bar-study.json \
  --out /tmp/four-bar-crank-rocker-study-003

node mechanism-studio/scripts/audit-model.mjs \
  /tmp/four-bar-crank-rocker-study-003 \
  /tmp/four-bar-crank-rocker-study-003/audit.json
~~~

Build the generated folder through the explicitly prepared, pinned external Teardown checkout. The usual CI then tests the live HTML controls, the **OPEN/CROSSED** switch, seek determinism, visible distinct mechanism poses, full 720p24 H.264/AAC film and a manifest/evidence package. No changes to the Teardown upstream engine.

### Caveats and release gates

This is a purely kinematic model. Link thickness/interference, friction, bearing loads, elastic deflection, dynamic stress, motor torque, manufactured tolerances, real hardware GPU performance, and host-level isolation are **NOT_EVALUATED**. `releaseReady` remains false. A strict Grashof classification alone does not prove good force transmission or a manufacturable mechanism.
