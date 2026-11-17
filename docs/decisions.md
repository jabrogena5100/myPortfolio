# Decisions

Status key: **Proposed** (awaiting owner approval), **Settled**.
Nothing has been scaffolded. Versions below were read from the npm registry (`registry.npmjs.org/<pkg>/latest`) on 2026-11-17.

## D1. Framework: Astro vs Next.js static export — **Proposed: Astro**

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

Proposed pins (verify again at install): `astro 7.4.12`, `tailwindcss 4.3.5` (+ `@tailwindcss/vite 4.3.5`), `typescript 7.0.2`, `@playwright/test 1.65.1`, `@axe-core/playwright 4.14.0`, `lighthouse 13.6.0`. TypeScript 7 is new; fall back to 5.x if Astro's checker objects.

## D2. Hosting — **Proposed: S3 + CloudFront via Terraform; GitHub Pages as the zero-cost fallback**

| | GitHub Pages | S3 + CloudFront + Terraform |
| --- | --- | --- |
| Cost | Free | Small but non-zero (CloudFront/S3 requests, Route 53 zone if a domain is used); **not measured; verify list prices before apply** |
| Maintenance | Lowest | Low; Terraform state, certificate (must be in us-east-1 for CloudFront), OAC |
| Headers (CSP, HSTS, cache control) | Not controllable | Response-headers policy in Terraform |
| Demonstrates skill | No | Yes: it is itself a small cloud project, consistent with the services offered |
| Persistent paid compute | None | None (static) |

Recommendation: write the Terraform and runbook (Phase 7) and have the owner decide. Nothing will be applied by me.
A domain, DNS and `terraform apply` are the owner's actions.

## D3. Positioning and services — **Proposed**, to be confirmed against the other two evidence files

Positioning line (draft): "Software engineer building payment-correct backends and the cloud infrastructure to run them." It rests on RyuStoreFront evidence only; RyuCloud and wildfire evidence may change it.

Services supportable by **RyuStoreFront evidence alone**:
1. **Backend APIs, data systems and payment workflows** (Java/Spring Boot, PostgreSQL, Stripe in test mode, idempotent webhooks, state machines, outbox/worker).
2. **Cloud infrastructure and deployment** (Terraform, ECS Fargate, RDS, ALB, ACM, per-session deploy and destroy with an audit script).
3. **Full-stack application development** (Next.js frontend wired to an API, token-based design system, Playwright and axe verification).

Not yet supportable: distributed systems, AI-enabled systems, UAV/perception. Wait for the RyuCloud and wildfire evidence. The services page must say these are capabilities demonstrated in personal projects, with no clients, revenue or users implied.

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

## D6. Open items blocking later phases (not Phase 1)

- RyuCloud and wildfire evidence files (placeholders will be used until they arrive).
- Resume PDF (the link stays absent until you provide it).
- Which public contact links (email, GitHub, LinkedIn) you want shown; I will not invent them.
- Whether you want a custom domain.
