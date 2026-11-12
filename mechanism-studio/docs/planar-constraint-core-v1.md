# Planar Constraint Core v1 (experimental, implementation slice)

**Repository:** AVANT-ICONIC/skills, Mechanism Studio. **Status:** candidate for draft PR, unmerged. No production simulator replacement in this slice.

## Intent and implementation boundary

The present slider-crank and four-bar visualizations each use a trusted, mechanism-specific analytic solver. Introduce a **single generic point-constraint evaluator** without adding a fourth hardcoded machine. In v1 the core can solve small 2D fixed/free point networks with distance and axis-guide relationships. Its result acts as an *independent audit oracle* for the existing renderer and supports a distinct five-bar dual-driver geometry in headless tests. It does not generate a machine UI or an engineering-certified motion solver for arbitrary topology.

## Contract

- Schema `avant.planar-constraints/1`: 2–16 named points, at least one and at most 8 free points, at most 48 constraints; millimetres only. A point is **either** fixed `[x,y]` or initialized by an explicit `[x,y]` seed. No external scripts, arbitrary expressions or network retrieval.
- Allowed constraints: `distance(a,b,lengthMm)` and `axis(a,origin,direction)` for a unit-length directed guide. Constraint residuals and analytic Jacobians are evaluated from data.
- A small damped Gauss–Newton step solves the least-squares residual locally, with capped iterations and deterministic initial conditions. **This is not** SciPy/MINPACK's full robust least-squares implementation; see [SciPy's least_squares discussion](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.least_squares.html) for the wider algorithm space and caveats.
- Statuses: `closed` (converged, full-rank local root), `singular` (converged root but rank-deficient Jacobian), `underdetermined` (fewer scalar constraints than free coordinates), `unreachable` (only when two-distance/circle geometry proves impossible), `ambiguous` (coincident equal-radius circles), `unresolved` (not numerically solved, **not** proven impossible). Unknown topology or unsupported constraints fail closed.
- Branch selection uses **explicit seeds**, not implicit frame-to-frame continuity. This does not discover, enumerate or certify *all* possible branches. A branch display switch must still be proven in the trusted existing four-bar runtime.

## Observable acceptance gates

1. Numerically reproduce both branches of the existing four-bar across at least 180 driver angles and the slider-crank across at least 90 angles, comparing against independent closed-form geometry.
2. Solve an *unseen* five-bar dual-input linkage's floating shared joint without adding another specialized equation. Solve a network containing **two free points and four constraints**.
3. Falsify unsupported input, out-of-range geometry, degenerate tangent circles, underdetermined equations, and mismatch of selected branch or output pose. Verify deterministic arbitrary seek order.
4. Integrate a measured generic-constraint agreement claim into the **existing source-brief audit** for slider-crank and four-bar, keeping the original analytic solvers authoritative for rendering. Mark the Geneva intermittent solver unsupported by this numeric core rather than faking a proof.
5. Retain `releaseReady=false` and real-source-document verification `NOT_EVALUATED`. The same CI path must run the unit tests, source package integrity and visual film regression **once** on the final candidate revision. No merge, Teardown fork or Motion-OS/ICONICUT changes.

## Known limitations and risk

Pure finite-dimensional local solving is neither global reachability analysis, exact interval arithmetic, robust dynamics, singularity continuation nor collision/force simulation. Stiff near-singular problems and poor starting guesses may be `unresolved` even if physically solvable. A hash or mathematical closure audit cannot independently verify the semantic content of external source URLs or safe physical assembly. Hardware GPU, sandbox, real-world tolerance and engineering accuracy remain separate release gates.
