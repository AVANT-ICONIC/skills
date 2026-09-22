# Audit Framework

This reference expands the operational checks used by the SEO + AI SEO skill.

Use it for full audits, implementation planning, and high-stakes site migrations. Skip sections that do not apply to the site.

## 1. Site truth and entity lock

Create a compact fact table before changing public-facing search signals.

Recommended fields:

| Field | Required |
| --- | --- |
| Canonical brand name | Yes |
| Allowed short forms | When applicable |
| One-sentence definition | Yes |
| Primary conversion | Yes |
| Secondary conversions | When relevant |
| Audience | Yes |
| Disqualifiers / not-a-fit cases | When known |
| Geography / service area | Yes |
| Language(s) | Yes |
| Currency | When commercial |
| Public price / pricing model | When it exists |
| Contact method | Yes |
| Proof assets | Yes, inventory only |
| Legal/commercial frozen pages | When applicable |
| Retrieval crawler policy | Explicit |
| Model-training crawler policy | Explicit |

For entity-heavy sites, also capture stable identifiers such as:

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

Only include true, resolvable identifiers.

## 2. URL inventory

For each important public URL record:

| Field | Purpose |
| --- | --- |
| URL | Canonical identifier |
| Status | 200 / redirect / error |
| Indexability | indexable / noindex / blocked |
| Canonical | self / other |
| Title | Search topic |
| H1 | Page topic |
| Meta description | Snippet intent |
| Page type | home / service / product / category / article / about / contact / legal / other |
| Primary intent | learn / compare / buy / trust / support |
| Initial HTML content | yes/no |
| Schema types | Machine semantics |
| Primary CTA | label and target |
| Notes | Defects / opportunities |

Default scope is all public marketing and money pages, then supporting resources.

## 3. Crawl and index checks

Inspect:

- robots.txt;
- robots meta;
- X-Robots-Tag;
- HTTP status;
- redirect chains/loops;
- canonical tags;
- sitemap coverage;
- orphan pages;
- duplicates/near-duplicates;
- faceted navigation;
- pagination;
- query-parameter variants;
- staging leakage;
- www/non-www;
- HTTP/HTTPS;
- trailing-slash variants where relevant;
- hreflang;
- soft 404s;
- broken internal links;
- pages linked only through JavaScript events;
- content that exists only after client rendering.

High-priority failures include:

- home or money pages non-200;
- noindex on intended search pages;
- incorrect canonical target;
- blocked crawling;
- empty initial HTML for critical facts when relevant crawlers cannot access rendered content;
- sitemap entries that are noncanonical, non-200, or intentionally noindex;
- conflicting hreflang/canonical signals;
- unresolved host/protocol duplication.

## 4. Architecture and internal linking

Check:

- important pages reachable in a few logical steps;
- navigation labels use user language;
- important money pages are not orphaned;
- supporting articles point to the relevant canonical offer;
- anchor text describes the destination;
- related topics form coherent clusters without forcing an artificial hub model;
- no page competes unnecessarily with another internal page for the same intent;
- pagination/facets do not create crawl traps.

Architecture should make entity, offer, evidence, and next action relationships easy to infer.

## 5. Search intent and topic coverage

For each page identify:

\`\`\`text
primary audience
primary intent
main topic
supporting questions
comparison questions
commercial/local modifiers
funnel stage
unique evidence
desired conversion
canonical page
\`\`\`

Check whether search results and current competitors suggest a different intent than the page serves.

Do not split one useful page into many near-duplicates solely to target phrasing variants.

## 6. On-page checks

Evaluate:

- title specificity;
- H1 clarity;
- meta description usefulness;
- URL stability;
- answer/offer clarity above the fold;
- heading hierarchy;
- fact density;
- source attribution where needed;
- internal links;
- image alt text where appropriate;
- original media;
- visible author/organization context;
- publish/modified dates only when meaningful;
- CTA path;
- mobile readability.

Titles should identify the real topic, not just the brand slogan.

## 7. Content quality and information gain

Classify content into:

- unique first-party evidence;
- expert interpretation;
- useful synthesis;
- commodity repetition;
- obsolete or misleading material.

Prefer:

- tests;
- data;
- examples;
- screenshots;
- original images/video;
- real price/process information;
- case studies;
- decision criteria;
- constraints;
- tradeoffs;
- failure cases;
- implementation detail;
- current updates.

Flag pages whose main value can be reproduced from generic public knowledge.

## 8. CRO and five-second test

For each money page ask whether a first-time visitor can immediately identify:

- what is sold;
- who it is for;
- what is included;
- evidence/trust;
- next action.

Check:

### Above the fold
- specific value proposition;
- primary CTA visible on mobile;
- CTA names the next step;
- no competing primary actions;
- real trust fragment where available.

### Proof
- testimonials are attributable when possible;
- claims are supported;
- named clients/logos are legitimate;
- objections are addressed;
- comparison/not-for-you guidance exists where confusion is likely.

### Action
- forms ask only for next-step information;
- labels and errors are usable;
- booking/checkout/contact path has no surprise friction;
- CTA repeats at natural decision points;
- contact details are crawlable text.

### Trust
- pricing/billing/currency is clear when public;
- service scope/timeline is clear when known;
- relevant policies are findable;
- no placeholder proof remains.

### Mobile
- tap targets usable;
- sticky elements do not obscure CTA or consent controls;
- media is appropriately sized;
- third-party scripts justify their cost.

## 9. Structured data checks

Validate against current platform requirements.

Possible types:

- Organization;
- LocalBusiness;
- Person;
- Product;
- Offer;
- Service;
- Article/BlogPosting;
- BreadcrumbList;
- VideoObject;
- Event;
- JobPosting;
- SoftwareApplication.

Verify:

- visible content matches markup;
- stable @id values where appropriate;
- provider/publisher relationships are coherent;
- price/currency/availability match visible offer;
- reviews/ratings are real and visible;
- dates are accurate;
- no retired rich-result behavior is promised.

Do not add every possible property merely because schema.org defines it.

## 10. Local SEO checks

When local intent matters:

- Google Business Profile completeness;
- Bing Places relevance;
- categories/services;
- NAP consistency where appropriate;
- opening hours;
- service areas;
- review quality/velocity;
- local proof;
- local landing-page usefulness;
- maps/directions/contact;
- LocalBusiness schema;
- language/region targeting.

Avoid thin city pages that repeat the same copy with a changed place name.

## 11. Ecommerce checks

When products are sold:

- Merchant Center/feed alignment;
- Product/Offer structured data;
- variant canonicalization;
- price/currency;
- availability;
- shipping/returns;
- product identifiers;
- category architecture;
- faceted navigation;
- reviews;
- comparison/detail content;
- images;
- feed/page consistency;
- product-page initial HTML;
- agent-readable purchase path.

Do not mark up nonexistent offers or reviews.

## 12. AI visibility baseline

Build a stable prompt set.

Recommended groups:

- category discovery;
- job-to-be-done;
- comparison;
- local;
- price;
- fit/use case;
- constrained shopping/research;
- brand fact check.

For each run record:

| Prompt | Engine | Date | Brand named? | Site cited? | Recommended vs mentioned | Wrong/missing facts | Source/competitor |
| --- | --- | --- | --- | --- | --- | --- | --- |

Keep the exact prompt wording stable for before/after measurement.

Prompt testing is observational and can vary by model, location, user state, and time. Report those limitations.

## 13. AI retrieval/citation heuristics

Treat these as evidence-tiered tests, not universal ranking rules:

- semantic alignment between title, content, and likely retrieval query;
- natural readable URL;
- concise fact-rich passages;
- answer-first blocks;
- genuine comparison tables;
- explicit entity names;
- freshness for time-sensitive content;
- attributable original data;
- third-party corroboration;
- strong relevant media;
- clear price/availability facts.

Do not deform human-readable writing into fragments for retrieval.

## 14. Crawler policy checks

Separate:

- classic search crawlers;
- AI search/index crawlers;
- user-triggered fetch agents;
- model-training crawlers.

Verify current names before changing robots.txt.

Check both robots policy and actual infrastructure responses.

Potential failure points:

- CDN bot protection;
- WAF;
- CAPTCHA/challenge;
- reverse proxy;
- rate limiting;
- image CDN;
- subdomain policy mismatch.

## 15. llms.txt and alternate representations

Treat as optional.

Before implementation:

- re-check current llms.txt proposal;
- decide whether the site has a real agent/documentation use case;
- keep links curated;
- use absolute canonical URLs;
- keep alternate Markdown semantically aligned with the visible page;
- do not create hidden agent-only claims.

Never describe llms.txt as a Google ranking factor.

## 16. Off-site authority gap

List real external gaps separately from on-site work.

Possible actions:

- complete legitimate business profiles;
- align company descriptions;
- improve partner/customer references;
- publish original data worth citing;
- earn editorial coverage;
- collect real reviews;
- publish useful videos/transcripts;
- participate honestly in relevant communities.

Do not fake notability, review activity, community discussions, or editorial coverage.

## 17. Performance and page experience

Use real field data when possible.

Check:

- LCP;
- INP;
- CLS;
- mobile usability;
- intrusive interstitials;
- layout stability;
- image dimensions;
- lazy loading;
- render-blocking third-party scripts;
- accessibility regressions.

Do not let performance micro-optimization displace major intent/content problems.

## 18. Migration and redesign checks

For migrations:

- URL mapping;
- redirect plan;
- canonical host;
- sitemap update;
- internal-link update;
- hreflang;
- structured data preservation;
- metadata preservation/improvement;
- analytics/Search Console continuity;
- staging noindex;
- post-launch crawl;
- indexation monitoring.

Do not ship a redesign that silently drops useful copy, internal links, or structured data.

## 19. Verification

After changes:

- fetch raw HTML;
- fetch rendered page when relevant;
- confirm status/canonical/noindex;
- validate schema;
- validate sitemap;
- validate robots;
- validate internal links;
- check important crawler access;
- rerun focused performance checks;
- rerun affected AI baseline prompts;
- measure business outcome after enough time/data.

Do not claim success from implementation alone.
