# Decisions

Status key: **Proposed** (awaiting owner approval), **Settled**.
Nothing has been scaffolded. Versions below were read from the npm registry (`registry.npmjs.org/<pkg>/latest`) on 2026-11-17.

## D1. Framework: Astro vs Next.js static export — **Settled: Astro** (owner approved 2026-11-17)

| Criterion | Astro 7.4.12 (published 2026-11-13) | Next.js 16.4.6 (2026-11-09), `output: 'export'` |
| --- | --- | --- |
| Static hosting on S3 + CloudFront | Output is plain `dist/` HTML/CSS/JS. Direct fit | Also plain `out/`, but export mode disables features (no rewrites, headers, middleware, ISR); trailing-slash and `.html` routing need care on S3 |
| Terraform compatibility | Same for both: Terraform deploys a bucket, CloudFront and OAC; the framework only produces files | Same |
| GitHub Pages | Works; official deploy guide | Works with `basePath` caveats if served from a repo subpath |
| Build complexity | Small. Vite-based; Node `>=22.23.4` required (npm `engines`) | Heavier toolchain; Node `>=20.9.0` |
| JS shipped by default | Zero JS for static pages; islands hydrate only where used | React runtime and hydration shipped on every page, even if all content is static |
| Accessibility | Plain semantic HTML by default; easy to keep native elements | Equivalent if written carefully; hydration adds failure modes |
| Animation | CSS and the View Transitions API for page transitions; islands (React) only when a component truly needs it | Framer-style libraries are the common path; larger bundle |
| Maintenance burden | Content collections (Markdown/MDX + typed schema) suit case studies. Fewer moving parts | More framework surface (server components concepts that are unused in export) |
| SEO / metadata | Static HTML per page, easy `<head>`, sitemap integration | Metadata API works in export; fine |
| Image optimization | `astro:assets` optimizes **at build time** (AVIF/WebP, responsive `srcset`), which is exactly what static hosting needs | `next/image` default loader needs a server; in export you must set `unoptimized` or a custom loader, losing built-in optimization |
| Reuse of 21st.dev components | Components are React + Tailwind + shadcn: usable as islands via `@astrojs/react` | Native |

**Why Astro.** The site has no server logic, no data fetching, no auth and few interactive parts. Next.js export gives nothing concrete here and costs bundle size and image optimization. **The one real Next.js advantage** is direct reuse of 21st.dev React components and familiarity from RyuStoreFront. That is worth little because I propose adopting only one or two React islands, and Astro supports them.

**Cost accepted.** Two mental models (Astro components + occasional React). Astro 7 is a recent major version, so I would pin exact versions and check that `@astrojs/react` and `@astrojs/tailwind`/`@tailwindcss/vite` support it before install.

**Settled 2026-11-17 (Phase 2, installed and built):** `astro 7.4.12`, `@astrojs/sitemap 3.7.5`, `@astrojs/markdown-remark 7.3.9` (Astro peer), `tailwindcss` and `@tailwindcss/vite 4.3.5`, `typescript 6.0.3`, `@astrojs/check 0.9.12`, Node `26.13.1` image. **Deviation from the proposal:** TypeScript 6.0.3 instead of 7.0.2, because `@astrojs/check` 0.9.12 declares peer `typescript ^5 || ^6`. Still to add in Phase 6: `@playwright/test 1.65.1`, `@axe-core/playwright 4.14.0`, `lighthouse 13.6.0`.

## D2. Hosting — **Settled: S3 + CloudFront via Terraform; GitHub Pages as the zero-cost fallback** (owner approved 2026-11-17; Terraform written in Phase 7, applied only by the owner)

| | GitHub Pages | S3 + CloudFront + Terraform |
| --- | --- | --- |
| Cost | Free | Small but non-zero (CloudFront/S3 requests, Route 53 zone if a domain is used); **not measured; verify list prices before apply** |
| Maintenance | Lowest | Low; Terraform state, certificate (must be in us-east-1 for CloudFront), OAC |
| Headers (CSP, HSTS, cache control) | Not controllable | Response-headers policy in Terraform |
| Demonstrates skill | No | Yes: it is itself a small cloud project, consistent with the services offered |
| Persistent paid compute | None | None (static) |

Recommendation: write the Terraform and runbook (Phase 7) and have the owner decide. Nothing will be applied by me.
A domain, DNS and `terraform apply` are the owner's actions.

## D3. Positioning and services: **Proposed** (revised 2026-11-17 after all three evidence files)

Full reasoning, comparison table and case-study outlines are in `docs/content-plan.md`.

Positioning line (draft): "Software engineer building backends that stay correct under retries and failure, and the AWS infrastructure to run them."

Services, ranked by evidence strength:
1. **Backend systems that stay correct under retries and failure** (payment webhooks, inventory holds, state machines, outbox and job-queue workers). Two independent projects, StoreFront and RyuCloud, with crash, race and duplicate tests.
2. **AWS infrastructure as code with cost-aware deploy and teardown** (Terraform, ECS Fargate, RDS, S3/CloudFront, SQS, an audit script). Each stack ran once; no always-on operation, no measured cost.
3. **Experiment design and audit for computer-vision models** (single-path evaluation harness, leakage audit, calibrated claims). Wildfire capstone; research context only.

Full-stack work is a capability, not a headline service (no deployed frontend and no visible demo). "Distributed systems" and "AI-enabled systems" are **not** claimed: no multi-node, load or production evidence; the AI work is an academic simulation. Every service page states "demonstrated in personal and academic projects; no clients, revenue or users".

## D4. Design direction — **Proposed**; full checklist in `design/ANTI-SLOP.md` (to be written in Phase 1)

- Near-black warm charcoal background (no navy), warm off-white text, muted gray secondary, **copper accent**, optional muted sage. This is deliberately different from RyuStoreFront's cobalt accent, so the portfolio does not look like its own project.
- Editorial layout: large type, generous whitespace, numbered sections, diagrams as hand-built inline SVG (legible, themeable, no screenshots of diagrams).
- Motion: CSS only (View Transitions API for page change, small opacity/translate reveals via `IntersectionObserver` or CSS scroll-driven animations where supported), full `prefers-reduced-motion` support. No animation library without a written justification.

## D5. 21st.dev components: **Proposed: borrow patterns, install no component code**

**Access (2026-11-17).** The 21st.dev MCP server (`mcp__21st-dev__*`) connected after the owner registered it with local scope. I used only `search` (free) and `get_component` (source and demo; the account reports tier `paid`, quota not limited). Queries were generic phrases ("spotlight card hover", "responsive navbar with mobile menu", "bento grid project showcase", "editorial portfolio hero section minimal"); no project names or personal details were sent. I did not use any of the tools that write, submit, delete or bookmark.

**Licence limit.** `get_component` returns source, demo and dependencies but **no licence field**. The only licence signal I have is what the public component pages showed (previous subagent read, 2026-11-17: jahed Spotlight Card "unknown"). The 21st.dev Terms (updated 2026-07-20) say component code belongs to its authors, and a copy needs a visible link back to the 21st.dev page. Without a stated licence I will not copy code.

**Source actually read** (3 components):

| Component | URL | Dependencies | Findings from the source | Decision |
| --- | --- | --- | --- | --- |
| Spotlight Card (jahed, EaseMize) id 2487 | https://21st.dev/@jahed/components/spotlight-card | none (React only) | Registers a `pointermove` listener on `document` **per card**; uses `background-attachment: fixed` and a 3:4 aspect default; injects CSS through `dangerouslySetInnerHTML` on each render; presets are blue/purple/green/red/orange hues (the glow hue shifts with pointer X, a rainbow effect that fights our palette). Page licence "unknown" | **Do not use.** Reimplement the idea: a single delegated pointer listener sets two CSS variables on the hovered card, a copper radial gradient, `(hover: hover)` and `prefers-reduced-motion` guards. Roughly 20 lines |
| Spotlight (ibelick) id 1500 | https://21st.dev/@ibelick/components/spotlight | `framer-motion`, shadcn `cn` | Bug: `removeEventListener` is passed fresh arrow functions, so the `mouseenter`/`mouseleave` listeners are never removed. Mutates the parent's `style.position` and `overflow` | **Reject**: leaks listeners and forces a large animation library for a gradient |
| Editorial Hero (felipemenezes098) id 19075 | https://21st.dev/@felipemenezes098/components/hero-05 | `motion`, `react-wrap-balancer`, `@radix-ui/react-slot`, `class-variance-authority` | Good layout: small tagline left, large serif headline right on a 12-column grid, wide image below. Entrance uses blur-in staggered reveals and respects `useReducedMotion` | **Borrow the composition only.** Build in Astro with CSS grid and `text-wrap: balance`; no blur-in effect, no motion library |

**Surveyed by search listing only** (no source read, no licence check): bento grids (kokonutd `bento-grid`, designali-in `bento-grid`, 0xUrvish `magnified-bento`), navbars (shadcnblockscom `navbar1`, preetsuthar17 `navbar-1`, ruixen.ui `floating-nav`), and the five brief patterns from the earlier read (Container Scroll Animation: `framer-motion`, listed "mit"; Scroll Morph Hero and Motion Footer: unknown licence, `framer-motion` / `gsap`). Not adopting any of them.

**Why nothing is installed.** The adopted ideas are small enough that a dependency would cost more than the code: a pointer spotlight is about 20 lines, an editorial grid is plain CSS, and navigation for a 6-page site is a native `<nav>` plus a `<details>`/`<dialog>` mobile menu (the approach RyuStoreFront took, `docs/decisions.md` there). This keeps the bundle near zero JS, avoids unlicensed code and avoids the `shadcn` toolchain. Where a pattern is borrowed, `design/COMPONENT-NOTES.md` (Phase 1) will credit the 21st.dev page as inspiration and state that no code was copied.

**Honest summary.** The five popular components you named were all evaluated. None fits the brief's "restrained" requirement and licence standard. If you still want one installed, say which and I will read its source and licence first.

## D6. Open items (owner decisions; see `docs/content-plan.md` section 7)

- RyuCloud and wildfire evidence files (placeholders will be used until they arrive).
- Resume PDF (the link stays absent until you provide it).
- Which public contact links (email, GitHub, LinkedIn) you want shown; I will not invent them.
- Whether you want a custom domain.

## D7. Phase 2 scaffold choices (2026-11-17)

| Decision | Choice | Tradeoff |
| --- | --- | --- |
| Telemetry | Astro telemetry disabled in `scripts/web.sh` (`ASTRO_TELEMETRY_DISABLED=1`, `DO_NOT_TRACK=1`) | None; Astro prints a data-collection notice by default |
| Palette enforcement | `--color-*: initial` in Tailwind `@theme`, so only token colours exist | Cannot use `bg-gray-800` and similar; intended |
| Fonts | System stacks until the owner picks faces in Phase 3; nothing downloaded | Headline face is generic until then |
| `site` / sitemap | Not set yet; `@astrojs/sitemap` is installed but not enabled until the domain is chosen | No canonical URLs or sitemap until Phase 7 |
| Trailing slash | `always`, `build.format: directory` | Matches S3/CloudFront `index.html` behaviour; needs a CloudFront function or default root object per directory in Phase 7 |
| Owner details | Display name "Joshua Abrogena"; contact links and resume are **placeholders** until supplied | Contact and resume pages show a plain "to be added" state |
| Domains | `ryustorefront.net` and `ryucloud.link` may be mentioned; both are currently down and the case studies say so | No live links |
| Repo links | Not shown until the owner confirms each is public | Placeholders |

## D8. Phase 3 choices (2026-11-17)

| Decision | Choice | Tradeoff |
| --- | --- | --- |
| Fonts | Source Serif 4 **Display** Regular for headlines, Hanken Grotesk variable for body, both OFL 1.1, self-hosted unmodified (`docs/fonts.md`). Owner chose "option C" | 144 KB of fonts in total. Source Serif's Reserved Font Name forbids trimming without renaming, so I did not subset it. Display optical size is designed for large text, so it is used for headings only. No italic is loaded; `font-synthesis: none` prevents fake italics |
| Navigation | Native `<nav>`, a desktop list and a mobile `<details>` menu, with about 10 lines of script for Escape and outside click | Two copies of the link list in the DOM, one always hidden |
| Page transition | CSS cross-document View Transitions, a short fade, disabled under reduced motion | Chromium only; elsewhere pages simply navigate |
| Card interaction | The whole card is the link (heading link stretched with `::after`); the spotlight is our own 15 lines | One focus target per card; clicking the card text follows the link |
| Cards layout | Stacked below 1024 px, three columns from 1024 px | Tablet cards are wide and long; narrow columns looked worse |
| Placeholders | Projects, Services, About and Contact pages are minimal "in progress" pages so that nothing links to a 404 | They are indexable placeholders until Phases 4 and 5 replace them |
| Home copy source | All factual copy lives in `src/data/site.ts` beside its evidence reference | Case-study pages will import from the same data so numbers cannot drift |

## D9. Phase 4 choices (2026-11-17)

| Decision | Choice | Tradeoff |
| --- | --- | --- |
| Where numbers live | `src/data/facts.ts`: every quoted result has `short`, `claim`, `context`, `status` and `date`. Home cards and case studies read it | Prose in tables (the wildfire matrices) is still typed by hand, so no test compares it to the evidence automatically; I checked it by hand |
| Status vocabulary | Run, User-reported, **Documented**, Not run. "Documented" was added for results I quote from a project document and did not re-run | A fourth label; the home page "How I verify" band and the projects index now show four |
| Wildfire figures | The author's own report figures (five of six), shown on a light mat (new token `--color-plate`) with a "Report figure" label. Figure 07 left out | They are blue and orange on white. Redrawing in the site palette from the recorded numbers was the alternative; I did not alter the charts |
| StoreFront screenshots | Four images, each labelled "Real API data" or "Fixture data". The "live" listing shows 100 products, so it is not described as 49,507 | They are placeholder-picture screenshots (typographic initials), so they show layout, not photography |
| Image handling | Source PNGs in `src/assets`, optimised to WebP at 480 to 1600 px by `astro:assets` at build time | Source PNGs stay in the repository (about 2 MB) |
| Diagrams | Hand-written inline SVG, five of them, each with a title, description and visible caption. They scroll sideways on narrow screens with a hint, rather than reflow | Phone readers scroll; a vertical phone layout per diagram was the alternative |
| Tables | Prose tables are keyboard-focusable named regions; numeric tables keep a minimum width and scroll on phones with a sticky caption | More horizontal scrolling on phones, but numbers never wrap |
| Role and AI statement | Each case study states the AI assistance in its meta block. The wildfire page also states my part (chose Boreal, examined its limitations, ran the synthetic and external evaluations) and calls the AI audit "audit input I checked", not independent review. A fuller "How I work" goes on the About page in Phase 5 | The wording rests on the owner's short written answer; the owner should confirm it |
| Links | No repository links on any page (placeholders). `ryustorefront.net` and `ryucloud.link` are named only as "currently down". Nothing links to the unpublished wildfire code, report or replay | Visitors cannot reach any code yet |
| Page length | Full 8-section template, not shortened, no collapsed sections | Long pages (10,000 to 15,000 px). Collapsing evidence is an option for the owner |

## D10. Phase 5 choices (2026-11-17)

| Decision | Choice | Tradeoff |
| --- | --- | --- |
| Contact and resume data | One object, `contact` in `src/data/site.ts`, with every value `null` until supplied. Pages show "To be added." and render real links the moment a value is set; the home hero, About, Contact, the home closing line and the footer note all switch together | Nothing public is invented. The owner edits one file |
| Contact form | None. No input, no storage, no analytics, no cookies, no third-party requests (all tested) | Visitors must use an email or profile link once supplied |
| How I work | A section on About (`#how-i-work`) listing what I decide, run and verify, the AI tools used (Claude Code on all three projects and this site; Codex as an audit reviewer on the wildfire project) and one disclosure about the capped GPU budget. A sentence in each case study links to it | Draft; the owner should confirm it line by line |
| Services evidence | Compact one-line facts with status and date, linking to the case study for setup. The three services are the ones in D3 | The full caveats are one click away, not on the page |
| "What I do not claim" | A section on Services and on About | Repetition between the two, on purpose |
| Experience | Only the owner's own description ("Independent Software Engineer, November 2026 to present"), with a note that it is not a claim of client work. Education and earlier experience are left to the resume | The About page is short and factual |
| Dates | Project dates are each repository's git history range (wildfire 2026-09-19 to 2026-11-13, RyuCloud 2026-11-03 to 2026-11-14) and, for RyuStoreFront, its first dated decision (2026-11-14) | They show when work was recorded, not hours; the page says so |

## D11. Phase 6 choices (2026-11-17)

| Decision | Choice | Tradeoff |
| --- | --- | --- |
| Lighthouse | `lighthouse` 13.6.0 as a dev dependency, run by `scripts/lighthouse.sh` in the Playwright image (HeadlessChrome 159), mobile and desktop presets, one run per page, home repeated 3 times | Local, no CDN, no compression, simulated throttling: a best case, not a field measurement |
| Stylesheet inlining | **Rejected after measuring.** Default `inlineStylesheets` kept | Lighthouse still lists two informational insights (render-blocking CSS, font chain) that cost no points. A cached shared stylesheet suits a CDN |
| Page budget | Initial load under 250 KB per page, asserted in a test (currently 7 to 180 KB uncompressed) | The home page is mostly fonts |
| Descriptions | At most 160 characters, unique per page, asserted | Shorter case-study descriptions |
| Favicon and robots | A plain "JA" monogram SVG built from the palette tokens, and `robots.txt` allowing all | A monogram is a design choice, not a brand claim; no sitemap line or canonical URL until the domain exists |
| Forced colors | Transparent borders on the primary button and skip link; tests run every page under `forcedColors: active` | None |
| Zoom and spacing | Tests assert 320 px reflow, 200% zoom, 200% text size and WCAG 1.4.12 spacing overrides on every page | Wide tables, code and diagrams scroll inside focusable regions rather than reflow |
| Deferred to Phase 7 | Canonical URLs, Open Graph URL and image, sitemap (all need the final domain), HTTP compression and security headers (CloudFront), Lighthouse on the deployed site | Social previews have no image until then |
| Owner AI-assistance corrections | About and the wildfire page now say Claude Code launched the RunPod sessions through the MCP server within a written budget, with the owner approving each next step, and that the "I run Git, AWS and Terraform" line applies to RyuCloud, RyuStoreFront and this portfolio only | Based on the owner's written answer; no separate evidence |
