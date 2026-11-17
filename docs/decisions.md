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

## D5. 21st.dev components — **Proposed shortlist, nothing installed**

The 21st.dev MCP server is **not available in this session** (no such tool is exposed), so I used the public site. Component pages were read through a subagent; source code was **not** visible without a 21st.dev API key (install commands require `API_KEY_21ST`), and I have not created one. So I have not inspected any component's actual code and claim no code review.

Per the 21st.dev Terms (updated 2026-07-20): the page's per-component "License" field is the only licence signal; components copied elsewhere need a visible link back to the 21st.dev page; demos and previews are owned by 21st Labs.

| Component | URL | Page-stated licence | Dependencies listed | Verdict |
| --- | --- | --- | --- | --- |
| Spotlight Card (Hossain Jahed) | https://21st.dev/@jahed/components/spotlight-card | **unknown** | none listed (CSS custom properties) | Do not copy. The idea is a pointer-tracked radial gradient, about 15 lines of CSS and JS; write our own and credit the pattern |
| Container Scroll Animation (Manu Arora, Aceternity UI) | https://21st.dev/@manuarora700/components/container-scroll-animation | mit | `framer-motion` | Probably **skip**: a 3D scroll tilt is exactly the "template" effect to avoid, and it forces a large animation library |
| Scroll Morph Hero (Prashant Som) | https://21st.dev/@prashantsom75/components/scroll-morph-hero | unknown | `framer-motion` | **Reject**: unknown licence, heavy, decorative |
| Animated hero (Tommy Jepsen) | https://21st.dev/@tommyjepsen/components/animated-hero | mit | `framer-motion`, `lucide-react`, shadcn buttons | **Reject** for the same reason, but its rotating headline word pattern is not needed anyway |
| Motion Footer (Hossain Jahed) | https://21st.dev/@jahed/components/motion-footer | unknown | `gsap` (ScrollTrigger) | **Reject**: unknown licence plus GSAP |
| Bento / gallery / navbar candidates | listed in the notes below | **not checked** | not checked | Need a per-component look before any decision |

Candidate categories read (listings only; licences and responsiveness not checked): bento (`https://21st.dev/community/components/s/grid`), gallery/portfolio (`/s/gallery`), navigation (`/s/navigation-menu`).

**Honest conclusion.** The five "popular" patterns are mostly scroll-spectacle heroes that conflict with the brief's "restrained" requirement and your preference for lightweight CSS. Recommended: adopt **patterns, not code**, for (a) the spotlight hover on project cards (own CSS), and (b) a bento/asymmetric grid for the home capabilities block. Take at most one real component (a navbar or gallery with an `mit` licence) after reading its source. I need your decision on whether to create a 21st.dev API key (free tier has a daily install limit) so I can read source before choosing.

## D6. Open items blocking later phases (not Phase 1)

- RyuCloud and wildfire evidence files (placeholders will be used until they arrive).
- Resume PDF (the link stays absent until you provide it).
- Which public contact links (email, GitHub, LinkedIn) you want shown; I will not invent them.
- Whether you want a custom domain.
