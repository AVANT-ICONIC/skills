# Platform Guidance

Research snapshot: 2026-09-22.

This file records current first-party platform guidance that materially affects SEO + AI SEO work. It is intentionally dated. Re-check primary documentation before substantial engagements.

## Google Search

Primary source:
https://developers.google.com/search/

Current guidance includes:

- Google's generative AI features build on the normal Search ecosystem and SEO best practices remain relevant.
- Google recommends useful, unique, non-commodity content rather than special AI-only content.
- Google has explicitly said llms.txt is not required for Google Search and does not positively or negatively affect Google visibility or rankings.
- Google does not require special AI markup or artificial content chunking for generative features.
- Structured data helps Google understand page content but does not guarantee rich results or AI citations.
- Spam policies apply to generative Search surfaces.
- Preferred Sources expanded into AI Mode and AI Overviews in 2026.
- FAQ rich results were retired from Google Search in 2026. Honest FAQ content may still be useful, but do not promise a FAQ rich result.

Useful starting points:

- Search documentation:
  https://developers.google.com/search/docs
- Search updates:
  https://developers.google.com/search/updates
- Search appearance:
  https://developers.google.com/search/docs/appearance

Evidence class: A.

## OpenAI / ChatGPT Search

Primary source:
https://help.openai.com/

Current publisher guidance includes:

- Public websites can appear in ChatGPT search.
- OAI-SearchBot controls search discovery for summaries/snippets and should not be blocked when visibility is desired.
- robots.txt is not the only access layer. Infrastructure such as CDN/WAF/bot protection can still prevent crawling.
- Search discovery controls are conceptually separate from model-training crawler policy.
- noindex can be used when a site does not want a page surfaced even if links are discovered elsewhere.

Useful starting point:

- Publisher/developer FAQ:
  https://help.openai.com/en/articles/12627856-publishers-and-developers-faq

Re-check exact crawler names, IP guidance, referral parameters, and product behavior before implementation.

Evidence class: A.

## Anthropic / Claude

Primary source:
https://support.claude.com/

Anthropic currently documents separate robots:

- ClaudeBot: model-development/training crawling.
- Claude-SearchBot: search-oriented crawling.
- Claude-User: user-directed retrieval.

This supports a separate retrieval-versus-training policy.

Useful starting point:

- Crawler documentation:
  https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

Re-check names and robots behavior before implementation.

Evidence class: A.

## Bing / Microsoft

Primary sources:
https://www.bing.com/webmasters/
https://blogs.bing.com/webmaster/

In February 2026 Microsoft introduced AI Performance in Bing Webmaster Tools.

Current reported measurements include:

- total citations;
- average cited pages;
- grounding queries;
- page-level citation activity;
- visibility trends.

Microsoft recommends using cited-page and grounding-query data to improve clarity, depth, evidence, freshness, and topical focus.

Bing also recommends IndexNow for notifying participating systems when content is added, updated, or removed.

Useful source:

- AI Performance announcement:
  https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview

Evidence class: A.

Do not infer that every answer engine has identical retrieval behavior simply because Microsoft provides grounding infrastructure to partners.

## Perplexity

Primary source:
https://docs.perplexity.ai/
and current Perplexity crawler/help documentation.

When Perplexity visibility matters:

- verify the current crawler/user-fetch names;
- check robots access;
- distinguish platform-specific behavior from general SEO;
- test live citations rather than assuming Google/Bing parity.

Evidence class: A for documented crawler behavior, C for unsupported ranking hypotheses.

## llms.txt

Primary proposal:
https://llmstxt.org/

Version 2 of the proposal was published in August 2026.

Current proposal additions include:

- \`rel="describedby"\` to identify the applicable llms.txt file;
- \`rel="alternate" type="text/markdown"\` to identify a Markdown representation.

Important classification:

- llms.txt is a proposal/convention, not a Google ranking requirement.
- Google explicitly says it does not improve or hurt Google Search visibility.
- It may be useful for systems/tools that consume it.
- Adoption and consumption are uneven.

Evidence class:
- A for Google's statement about Google Search.
- B/C for broader ecosystem usefulness depending on observed client/tool support.

## Third-party observational research

Large industry studies can be useful for forming experiments around:

- title/query semantic alignment;
- human-readable URLs;
- freshness;
- content position;
- brand mentions;
- citation patterns;
- comparison queries;
- source-type preferences.

Treat these findings as correlation unless a platform confirms causality.

Never hard-code a third-party ranking factor into the skill as fact.

Evidence class: B or C.

## Refresh protocol

Before a substantial engagement:

1. check whether any platform guidance above has changed;
2. note the research date;
3. replace stale crawler names;
4. update retired features;
5. downgrade claims that no longer have first-party support;
6. separate current platform facts from experiments.

The dated snapshot exists to prevent invisible drift, not to freeze the web in 2026.
