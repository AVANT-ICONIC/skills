---
name: seo-aiseo
description: Audit and improve websites for traditional search, AI-driven discovery, citation visibility, entity clarity, local relevance, conversion readiness, and agent-readable commerce using current evidence. Use for technical SEO audits, AI SEO/AEO/GEO work, content and information architecture, local SEO, structured data, crawler policy, AI citation analysis, or implementation planning. Do not use for generic copywriting, unsupported ranking guarantees, or mass content generation.
compatibility: "Requires access to the target website and current web documentation. Repository, CMS, analytics, Search Console, Bing Webmaster Tools, or crawl data are optional but improve the audit."
---

# SEO + AI SEO

Improve the probability that a site can be crawled, indexed, understood, retrieved, cited, recommended, and converted from.

Treat AI SEO, AEO, and GEO as extensions of search optimization rather than separate disciplines with their own folklore.

The operating sequence is:

\`\`\`text
truth
  -> crawlable
  -> indexable
  -> relevant
  -> useful and original
  -> trusted and corroborated
  -> retrievable
  -> citable or mentionable
  -> convertible
\`\`\`

Do not optimize for citations while basic crawlability, indexing, relevance, or factual clarity is broken.

## When to use

Use this skill for:

- technical SEO audits;
- full-domain SEO audits;
- page-level search optimization;
- AI search visibility audits;
- AEO/GEO strategy;
- Google AI Overviews or AI Mode visibility;
- ChatGPT Search visibility;
- Bing or Copilot citation visibility;
- Perplexity or Claude search discoverability;
- local SEO;
- ecommerce search and agent readiness;
- structured data reviews;
- crawler and robots policy;
- content architecture and internal linking;
- information-gain analysis;
- Search Console or Bing Webmaster analysis;
- competitor citation-gap analysis;
- implementation plans or repository changes that affect search discovery.

Do not use this skill for:

- generic blog ideation with no search or business objective;
- bulk keyword pages;
- doorway or location spam;
- fake reviews, fake citations, or synthetic reputation building;
- guaranteed ranking or citation claims;
- replacing legal, pricing, credential, or offer facts with inferred content.

## Non-negotiable rules

1. Never invent facts, proof, prices, awards, credentials, clients, statistics, review counts, guarantees, or case-study results.
2. Never change the offer unless the owner explicitly changes it.
3. Schema must match visible, truthful page content.
4. Do not use hidden text, cloaking, doorway pages, keyword stuffing, or fake authority signals.
5. Separate retrieval/search crawlers from model-training crawlers. They are different policy decisions.
6. Do not treat correlation studies as platform rules.
7. Do not treat llms.txt, Markdown mirrors, or "AI schema" as ranking requirements.
8. Preserve brand voice unless the user asks for copy changes.
9. Accessibility, mobile usability, and conversion clarity must not regress for search optimization.
10. Every recommendation must identify the affected page or system, the problem, the exact change, the expected effect, the evidence level, and how to verify it.
11. Prefer first-party platform documentation for platform-specific claims.
12. Re-check current platform guidance before substantial work.

## Evidence hierarchy

Classify material recommendations by evidence strength:

\`\`\`text
A  official platform documentation or direct first-party evidence
B  large independent observational study or repeatable industry dataset
C  plausible experiment, limited evidence, or hypothesis
X  contradicted, obsolete, spammy, or unsupported tactic
\`\`\`

Rules:

- A outranks B.
- B is correlation unless causality is demonstrated.
- C must be presented as an experiment.
- X should normally be rejected.
- If sources disagree, state the disagreement.
- Do not convert vendor research into a search-engine rule.

## Mandatory freshness check

Before a substantial audit, verify current guidance from the platforms that matter to the site.

At minimum consider:

- Google Search Central and Search Console;
- OpenAI publisher/crawler documentation;
- Bing Webmaster Tools and IndexNow;
- Anthropic crawler documentation when Claude visibility matters;
- Perplexity crawler/search documentation when relevant;
- Merchant Center, Business Profile, image/video, international, local, or commerce documentation when relevant.

Use the dated platform notes in \`references/platform-guidance.md\` as a starting point, not as a permanent truth. Refresh material claims when platform behavior has changed.

## Read the references

For a full audit, read:

- \`references/audit-framework.md\`
- \`references/platform-guidance.md\`
- \`references/output-contract.md\`

For a quick page audit, the core skill can be sufficient.

## Modes

### Quick audit

Use for a single page or fast diagnosis.

Check:

- crawl/index eligibility;
- title, H1, meta description, canonical;
- primary search intent;
- first-screen clarity;
- main answer or offer;
- internal links;
- schema relevance;
- AI retrieval crawler access;
- one or two information-gain opportunities;
- conversion clarity;
- top five actions.

### Full audit

Use for a domain or serious engagement.

Create a site truth, inventory important public URLs, audit technical foundations, architecture, content, entity authority, AI visibility, conversion, off-site gaps, and measurement.

### Page optimization

Use when the user wants one page improved.

Return exact recommendations for:

- title;
- meta description;
- H1 and H2/H3 structure;
- opening answer or offer block;
- internal links;
- media;
- structured data;
- factual evidence;
- freshness;
- AI retrieval/citation opportunities;
- conversion path.

Do not rewrite finished body copy unless the page fails its purpose and the user wants a rewrite.

### Competitive AI visibility analysis

Use when competitors are mentioned or cited by answer engines but the target site is not.

Compare:

- prompt coverage;
- cited pages;
- page titles and semantic alignment;
- original evidence;
- freshness;
- entity clarity;
- third-party corroboration;
- indexed availability;
- answer extractability;
- local or commercial fit.

Do not equate citation frequency with objective quality.

### Implementation mode

When the user asks for actual repository or CMS changes:

1. preserve the audit's factual constraints;
2. inspect current implementation before editing;
3. make small coherent changes;
4. validate rendered HTML and raw/source HTML where relevant;
5. validate structured data;
6. re-check robots, canonical, sitemap, and crawler access;
7. rerun affected acceptance checks.

If the work requires a separate development workflow, hand the SEO requirements into that workflow rather than silently weakening them.

## Operating sequence

### Phase 0: establish site truth

Before optimization, lock the facts that must not drift.

Capture:

- canonical brand name;
- allowed short forms;
- one-sentence definition;
- audience;
- disqualifiers;
- primary conversion;
- secondary conversions;
- geography;
- language;
- currency;
- public price or pricing model;
- existing proof assets;
- contact method;
- pages with legal/commercial wording constraints;
- retrieval crawler policy;
- model-training crawler policy.

For substantial work, persist this as \`SITE_TRUTH.md\` or the project's existing source of truth.

For entity-heavy work, also maintain \`ENTITY.md\`.

A missing fact is a gap. It is not permission to invent one.

### Phase 1: inventory and technical eligibility

Discover important public pages using all applicable sources:

- XML sitemaps;
- homepage, navigation, footer, and internal links;
- canonical tags;
- CMS routes;
- repository routes;
- crawl exports;
- Search Console/Bing data;
- known campaign or money pages.

Record for each important URL:

- URL;
- HTTP status;
- indexability;
- canonical target;
- title;
- H1;
- meta description;
- page type;
- primary intent;
- initial-HTML content availability;
- schema types;
- primary CTA;
- notable issues.

Treat as high priority when:

- money pages are not 200;
- money pages are noindex or blocked;
- canonical points to the wrong URL;
- sitemap lists broken/noncanonical URLs;
- important content is unavailable to relevant crawlers;
- duplicate URLs or templates confuse canonical intent;
- redirects, host variants, protocol variants, or staging copies create conflicting versions.

### Phase 2: architecture and intent

Map each important page to one canonical job.

For each page identify:

- audience;
- primary intent;
- main topic/query;
- supporting questions;
- comparison questions;
- local/commercial modifiers;
- funnel stage;
- desired conversion;
- unique evidence;
- cannibalizing or competing internal pages.

Use one strong canonical page for a topic when possible. Do not create pages for every wording variant or fan-out query.

Internal architecture should make the relationship between entity, services/products, supporting evidence, and next actions obvious.

### Phase 3: on-page relevance and extractability

Evaluate:

- specific descriptive title;
- clear H1;
- useful meta description;
- stable readable URL;
- clear opening answer or offer;
- logical H2/H3 hierarchy;
- descriptive internal anchors;
- visible relevant facts;
- media that contributes evidence;
- authorship or organization identity where useful;
- dates only when meaningful;
- factual support;
- clear next action.

Prefer answer-first structure when a section answers a concrete question.

A short standalone answer immediately under a relevant heading can improve human comprehension and machine extractability, but do not turn every heading into a question or every paragraph into a snippet.

### Phase 4: conversion and five-second clarity

For money pages, a new visitor should quickly be able to answer:

1. What is this?
2. Who is it for?
3. What do I get?
4. Why should I believe it?
5. What do I do next?

Check:

- one primary conversion per page;
- visible mobile CTA;
- proof near decision points;
- price or pricing method where expected;
- scope/inclusions;
- timeline or availability when known;
- booking/purchase/contact path;
- form friction;
- visible policy and contact information.

Prefer structural fixes, answer blocks, proof placement, pricing clarity, and CTA improvements before rewriting the whole page.

### Phase 5: information gain

Prioritize content that cannot be produced from generic knowledge alone.

Look for:

- firsthand experience;
- original measurements;
- benchmarks;
- real case studies;
- test results;
- expert analysis;
- original screenshots;
- original photos/video;
- proprietary process;
- concrete pricing/ranges when publishable;
- tradeoffs and constraints;
- before/after evidence;
- current data;
- useful tools, templates, calculators, or datasets.

Use this test:

\`\`\`text
Could a generic model produce this page without access
to this company, expert, product, customers, or data?
\`\`\`

If yes, the page probably needs more unique value.

### Phase 6: structured data and machine clarity

Use structured data only when it truthfully reflects visible content.

Common types include:

- Organization;
- LocalBusiness;
- Person;
- Article;
- Product;
- Offer;
- Service;
- BreadcrumbList;
- VideoObject;
- Event;
- JobPosting;
- SoftwareApplication.

Follow current platform eligibility requirements, not generic schema folklore.

Validate markup.

Structured data can improve machine understanding and enable search features. It does not guarantee rankings, rich results, or AI citations.

There is no universal special "AI schema".

### Phase 7: entity, authority, local, and corroboration

Check whether the entity is represented consistently across relevant sources.

Depending on the business, inspect:

- official site;
- Google Business Profile;
- Bing Places;
- LinkedIn;
- GitHub;
- YouTube;
- major social profiles;
- partner/client sites;
- reputable directories;
- press;
- review platforms;
- professional profiles;
- relevant communities.

Prefer genuine context-rich mentions over bulk links or citation farms.

For local businesses, verify:

- accurate business name/address/phone where applicable;
- categories/services;
- service areas;
- hours;
- local landing-page relevance;
- reviews;
- local proof;
- LocalBusiness schema when appropriate.

### Phase 8: AI search visibility

First build a before-state.

Create a representative prompt set from buyer language, not from the site's marketing slogans.

For a full audit, use roughly 15 to 40 prompts when practical across:

- category discovery;
- job-to-be-done;
- comparison;
- local intent;
- price/cost;
- fit/use-case;
- agent-style constrained research or purchase tasks.

Across available engines record:

- date;
- prompt;
- brand mentioned;
- site cited;
- recommendation vs simple mention;
- incorrect/missing facts;
- cited source or competitor.

Re-run the same prompt set after meaningful changes.

Do not create a proprietary AI visibility score by default.

For platform-specific work, apply the current guidance in \`references/platform-guidance.md\`.

### Phase 9: retrieval versus training crawler policy

Do not collapse all AI crawlers into one allow/block decision.

Search/retrieval access affects discoverability. Model-training access is a separate owner policy.

Verify:

- robots.txt;
- meta robots;
- CDN;
- WAF;
- bot manager;
- challenge pages;
- IP allowlists when applicable;
- image/media hosts when crawlers need those resources.

A permissive robots.txt does not matter if the infrastructure returns 403 or a challenge.

Re-check crawler names and platform documentation before implementation.

### Phase 10: agent-readable offer readiness

For products and bookable services, determine whether a research or shopping agent can extract without guessing:

\`\`\`text
Brand
Category
Audience
Primary offer
Price or pricing model
Availability or booking path
Geographic/legal limits
Proof
Primary CTA URL
Contact
Differentiators
Not-a-fit conditions
\`\`\`

Use public HTML, truthful structured data, and stable URLs.

Missing fields are explicit machine-readability gaps.

Do not add hidden claims solely for agents.

### Phase 11: optional agent infrastructure

Evaluate \`llms.txt\`, Markdown mirrors, and related agent-discovery mechanisms only after core SEO is healthy.

Rules:

- Google currently does not treat llms.txt as a ranking requirement.
- llms.txt is optional infrastructure for systems that support it.
- Markdown mirrors must remain semantically consistent with canonical visible pages.
- Do not place hidden claims in alternate representations.
- Re-check the current llms.txt proposal before implementing its link relations or URL conventions.

Use these mechanisms when the cost is low and the site has a real agent/documentation use case, not as a substitute for crawlability or content quality.

### Phase 12: measurement

Prefer first-party platform and business data.

Track where available:

Google:
- organic impressions/clicks;
- queries;
- landing pages;
- indexed URLs;
- Core Web Vitals;
- structured-data issues;
- generative AI visibility reports when available.

Bing/Microsoft:
- indexing and crawl health;
- AI citations;
- cited URLs;
- grounding queries;
- citation trends.

Answer-engine baseline:
- brand mentioned;
- site cited;
- recommended vs mentioned;
- wrong facts;
- competitor/source cited.

Business:
- qualified leads;
- sales;
- bookings;
- signups;
- revenue;
- conversion rate;
- form starts/completions.

Traffic is not the final KPI unless traffic itself is the business objective.

## Priority model

Do not invent a fake search-engine score.

Use:

\`\`\`text
P0  crawl/index eligibility or severe technical loss
P1  high-impact relevance, architecture, truth, or conversion issue
P2  meaningful improvement opportunity
P3  experiment, polish, or low-confidence opportunity
\`\`\`

For each action record:

- priority;
- affected URL/system;
- SEO, AI SEO, conversion, or combined scope;
- evidence tier;
- impact;
- confidence;
- effort;
- exact change;
- verification method.

## Anti-patterns

Reject or flag:

- mass-generated doorway pages;
- fake reviews/testimonials;
- fake citations or mentions;
- keyword stuffing;
- hidden AI-targeted copy;
- date-only freshness updates;
- schema spam;
- thin location pages;
- copied commodity content;
- junk backlink campaigns;
- citation-farm directories;
- astroturfed community posts;
- guaranteed rankings;
- guaranteed citations;
- unsupported "AI ranking factors";
- indiscriminate llms.txt promotion;
- creating hundreds of near-duplicate pages for query fan-out.

## Completion criteria

A full engagement is complete when:

- important public marketing URLs are inventoried or a subset is explicitly scoped;
- crawl/index blockers are known;
- site truth is stable;
- intent/page-role conflicts are identified;
- information-gain gaps are explicit;
- structured data matches visible truth;
- entity/local gaps are identified;
- money-page conversion failures are explicit;
- relevant retrieval crawler access is checked;
- AI-specific recommendations are evidence-tiered;
- the AI visibility baseline exists or was explicitly waived;
- actions are prioritized and testable;
- measurement can be repeated after implementation;
- off-site dependencies are separated from on-site work.

Do not promise rankings. Produce evidence, exact fixes, and a repeatable measurement system.
