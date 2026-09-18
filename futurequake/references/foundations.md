# Foundations and Positioning

Futurequake's underlying question is old and important:

> How costly will future software change be under the current architecture?

Futurequake does not claim to invent scenario-based architecture analysis. Its contribution is an **agent-native operating method** for turning realistic future-change scenarios into disposable implementations against a real repository, then measuring the resulting change fingerprints.

## Scenario-based architecture analysis

Rick Kazman, Gregory Abowd, Len Bass, and Paul Clements described scenario-based architecture analysis in the 1990s as a way to exercise an architecture against scenarios and reason about quality attributes.

Reference:

- *Scenario-Based Analysis of Software Architecture* (1995 technical report): https://cs.uwaterloo.ca/research/tr/1995/45/CS95-45.pdf

This establishes the important premise that architecture should be evaluated against concrete scenarios rather than discussed only in abstract structural terms.

## ALMA

Architecture-Level Modifiability Analysis (ALMA), developed by PerOlof Bengtsson, Nico Lassing, Jan Bosch, and Hans van Vliet, formalized scenario-based analysis focused specifically on modifiability.

ALMA's core flow includes selecting an analysis goal, describing the architecture, eliciting change scenarios, evaluating those scenarios, and interpreting results.

References:

- *Experiences with ALMA: Architecture-Level Modifiability Analysis* (Journal of Systems and Software, 2002): https://doi.org/10.1016/S0164-1212(01)00113-3
- *Architecture-level modifiability analysis (ALMA)* (Journal of Systems and Software, 2004): https://doi.org/10.1016/S0164-1212(03)00080-3

Futurequake borrows the seriousness of change-scenario analysis but replaces much of the human estimation step with bounded executable experiments when coding agents make that economically practical.

## Evolutionary architecture and fitness functions

Evolutionary Architecture treats evolvability as a first-class concern and uses fitness functions to protect architectural characteristics as systems change.

Reference:

- Neal Ford, Rebecca Parsons, Patrick Kua, and later Pramod Sadalage: https://evolutionaryarchitecture.com/

Fitness functions usually protect properties during real evolution. Futurequake complements them by creating synthetic but plausible evolution to discover where the architecture is likely to resist before those requirements arrive.

## Residuality Theory

Residuality Theory frames architecture through stressors and the residues that remain after systems encounter them. It emphasizes designing for complex, uncertain environments rather than relying only on static structural representations.

Reference:

- Barry O'Reilly, *An Introduction to Residuality Theory: Software Design Heuristics for Complex Systems* (2020): https://doi.org/10.1016/j.procs.2020.03.120

Futurequake is narrower: it focuses on software changeability and uses implementable future requirements as stressors.

## What is distinct about Futurequake

The operating primitive is:

```text
real repository
  -> frozen plausible future requirement
  -> isolated disposable implementation attempt
  -> real verification
  -> measured change fingerprint
  -> implementation deleted
  -> evidence retained
```

Compare mode repeats the same frozen scenarios against two refs so a refactor or PR can be evaluated by empirical future-change resistance rather than architectural taste alone.

The method should therefore be described as **executable modifiability testing**, not as the invention of architecture scenarios themselves.

## Adjacent agent-era patterns

Modern coding-agent workflows increasingly use disposable worktrees for safe exploration. A "scout" agent may enter a temporary worktree, attempt or sketch a proposed change, estimate the files and effort involved, then discard the worktree and return only a summary. This is an important enabling pattern for Futurequake, but it answers a narrower question: how hard is this one proposed change?

Agent-Operable Architecture is another close neighbor. It starts from likely semantic changes and reviews whether they can be completed with bounded context, clear ownership, limited blast radius, and explicit proof. Its review protocol is primarily evidence-driven and read-only.

Futurequake differs by freezing a **portfolio** of plausible future requirements and executing each as an isolated implementation experiment, then interpreting repeated resistance across scenarios. Compare mode applies the identical portfolio to two refs under equivalent conditions.

These adjacent patterns should be credited rather than erased. Futurequake's claim is not that disposable worktrees, change scenarios, or architecture stress analysis are individually new. The contribution is their composition into repeatable executable modifiability testing.
