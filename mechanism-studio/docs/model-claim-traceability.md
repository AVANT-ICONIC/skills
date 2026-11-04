# Mechanism Studio: model-claim traceability (experimental)

**Owner:** portable Mechanism Studio skill in AVANT-ICONIC/skills.
**Status:** An internal mathematical consistency audit, **not** automatic scientific source verification or engineering certification.

## Why this exists

A technical reference URL alone does not establish that a generated mechanism accurately represents the source. The previous source register correctly recorded `sourcesFetched=false`, but there was no explicit audit showing which mathematical relationships actually held. This change provides a reproducible link between the input brief, a reviewed template, tested constraints and the film evidence.

The audit deliberately refuses to label a source as independently verified. A link to a technical article is **not** proof that the article was retrieved, licensed or examined.

## Traceability contract

1. **Request:** normalized `avant.mechanism-request/1` with source IDs, HTTPS reference URLs, parameters, units, provenance and film profile.
2. **Recipe identity:** before running any generated code, hash-match `main.js`, `stage.js`, `model.mjs`, `film-direction.mjs` against checked-in reviewed modules and `machine-config.mjs` against canonical serialization of the validated brief. Unexpected edits abort the audit.
3. **Independent mathematical checks:** run pure model calculations on many absolute-angle samples, comparing against separate geometric closure equations rather than merely testing output strings.
4. **Source honesty:** attach source IDs and numerical residuals to each claim, but mark external-document verification `NOT_EVALUATED` and `sourceDocumentsRetrieved=false`. Assumed dimensions remain explicit.
5. **Delivery:** include the audit in the versioned package under `evidence/model-audit.json`, hash the entire file, and require a green claim receipt before packaging.

## Currently supported mathematical claims

| Reviewed recipe | Claim | Meaning |
| --- | --- | --- |
| Slider-crank | Rigid rod closure | Crank-to-slider distance equals selected rod length over 1441 positions |
| Slider-crank | Independent piston formula | Position agrees with analytic root-geometry relation |
| Slider-crank | Exact dead-center stroke | Travel remains within 2 × crank radius, with zero ideal velocity at dead centers |
| Geneva | Pin-slot collinearity | Engaged drive pin remains aligned with active radial slot |
| Geneva | Ideal 75% dwell | Sampled fraction of input time with immobile output matches ideal four-slot kinematics |
| Geneva | Quarter-turn indexing | Output advances one 90° station per complete driver revolution |

The slider-crank relation is independently documented by [Planex2D](https://planex2d.org/docs/examples/slider-crank.html). The Geneva example uses the [Planex2D Geneva study](https://planex2d.org/docs/examples/geneva-drive.html). **These reference links are metadata in the generated brief; the current auditor does not fetch them.** The numerical model and pose checks run locally from checked-in source.

## Usage

After compiling a reviewed machine brief:

~~~bash
node mechanism-studio/scripts/compile-request.mjs \
  --request mechanism-studio/requests/slider-crank-study.json \
  --out /tmp/my-slider

node mechanism-studio/scripts/audit-model.mjs \
  /tmp/my-slider /tmp/my-slider/audit.json

node --test mechanism-studio/tests/audit-model.test.mjs
~~~

The auditor is **only intended to execute reviewed recipe modules** after source+config hash checks. The compiler rejects unknown machine types and arbitrary injected scripts. Run the tool in a credential-free ephemeral environment until an actual OS-level sandbox has been validated.

Package building requires `audit.json` plus successful real browser/video evidence. The resulting package retains immutable SHA-256 receipts and `releaseReady=false`.

## Limits and future evolution

- Source content was not retrieved or independently checked. Semantic source attestation must be a **separate verified step**, potentially with source page snapshots or licensed measurements and human approval. Do not silently change the meaning of source evidence to `verified`.
- Current mathematical check types are reviewed recipes, not a general high-fidelity physics solver.
- Force, wear, material, heat, collision dynamics, manufacturing tolerance and safety-critical correctness are out of scope.
- The hash audit detects altered compiled templates/configuration; it is not a digital signature or complete process sandbox.
- Hardware GPU/mobile and broader release/rights gates remain unverified.

This audit is a foundation for a future machine intermediate representation: each model must expose checkable constraints, with documented provenance and declared assumptions, **before** the renderer draws anything.
