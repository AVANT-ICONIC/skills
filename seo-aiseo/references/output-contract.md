# Output Contract

Use these artifacts for substantial full-site work. Do not create all of them for a tiny page audit.

## AUDIT_SUMMARY.md

Include:

- business/site definition;
- audit scope and date;
- key technical blockers;
- key intent/content findings;
- conversion findings;
- entity/authority findings;
- AI visibility baseline highlights;
- top prioritized actions;
- explicit limitations;
- what was not changed.

## SITE_TRUTH.md

Recommended structure:

\`\`\`markdown
# Site Truth

Brand:
Allowed short forms:
Definition:
Primary conversion:
Secondary conversions:
Audience:
Not a fit for:
Geography:
Languages:
Currency:
Public pricing:
Contact:
Proof assets:
Frozen/legal pages:
Retrieval crawler policy:
Training crawler policy:
\`\`\`

Do not fill unknown fields with guesses.

## ENTITY.md

Recommended structure:

\`\`\`yaml
name: ""
legalName: ""
url: ""
logo: ""
description: ""
areaServed: ""
sameAs: []
contactPoint:
  email: ""
  telephone: ""
\`\`\`

Include only real identifiers.

## SITE_INVENTORY.md

Use a table:

| URL | Status | Indexable | Canonical | Title | H1 | Type | Intent | Initial HTML | Schema | Primary CTA | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

For very large sites, summarize by template plus a representative/priority URL set, and keep a machine-readable export if available.

## AI_BASELINE.md

Use a stable prompt log:

| Prompt | Engine | Date | Brand named? | Site cited? | Recommended/mentioned | Wrong or missing facts | Cited source/competitor |
| --- | --- | --- | --- | --- | --- | --- | --- |

Document model/search mode, region, and other conditions when they materially affect reproducibility.

## CHANGE_PLAN.md

Recommended table:

| ID | Priority | URL/System | Problem | Exact change | Scope | Evidence | Impact | Confidence | Effort | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Scope examples:

- SEO;
- AI SEO;
- CRO;
- local;
- ecommerce;
- authority/off-site;
- combined.

Evidence examples:

- A;
- B;
- C;
- X.

Do not use vague actions such as "improve SEO".

## MEASUREMENT.md

Define:

- baseline date;
- Search Console metrics;
- Bing Webmaster/AI Performance metrics;
- answer-engine prompt set;
- business KPIs;
- measurement interval;
- expected lag;
- known confounders;
- next review date.

## Exact snippets

When the user wants implementation-ready output, provide exact final values for:

- title;
- meta description;
- H1/H2 changes;
- answer block;
- robots directives;
- canonical;
- hreflang;
- JSON-LD;
- llms.txt entry;
- internal-link anchor;
- CTA label;
- redirects.

Do not write "something like this" when exact implementation is requested.

## Priority semantics

\`\`\`text
P0  blocks eligibility or causes severe loss
P1  high-impact relevance, architecture, truth, or conversion issue
P2  meaningful improvement
P3  experiment or polish
\`\`\`

## Recommendation quality gate

Every action should answer:

1. Where is the problem?
2. What evidence shows it?
3. What exactly changes?
4. Why should that help?
5. What could go wrong?
6. How is success verified?
7. Is this on-site or off-site?
8. Does owner approval or factual input remain necessary?

## Completion statement

A full audit should finish with:

- confirmed blockers;
- prioritized action list;
- unresolved truth gaps;
- off-site dependencies;
- verification status;
- measurement plan;
- research date;
- platform sources used.

Do not include a fabricated "SEO score" or "GEO score" unless the user explicitly requests a custom scoring framework and its limitations are clear.
