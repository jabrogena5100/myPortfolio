# Fonts

Chosen by the owner 2026-11-17 for the developer-tooling redesign (the earlier Source Serif 4 and Hanken Grotesk pairing was replaced; it read as editorial). Both faces are licensed under the **SIL Open Font License 1.1**, verified 2026-11-17 from the upstream repository `vercel/geist-font` (GitHub reports `OFL-1.1`, release v1.9.2 published 2026-11-06). Files are self-hosted in `public/fonts/`; the site makes no third-party font requests.

| Use | Family | Source file (upstream path) | Shipped as | Size |
| --- | --- | --- | --- | --- |
| Headings and body | Geist (variable, weight 100 to 900) | `packages/next/dist/fonts/geist-sans/Geist-Variable.woff2` | `Geist-Variable.woff2` | 69,760 bytes |
| Labels, metrics, code, status badges | Geist Mono (variable, weight 100 to 900) | `packages/next/dist/fonts/geist-mono/GeistMono-Variable.woff2` | `GeistMono-Variable.woff2` | 71,596 bytes |

The licence text is shipped beside the fonts: `public/fonts/OFL-Geist.txt` (copied from `OFL.txt` in the repository).

## Conditions that matter (OFL 1.1)

- Embedding and redistribution with the site is permitted; the licence text travels with the fonts (done).
- The fonts are not sold on their own.
- The licence's copyright line (`Copyright 2026 The Geist Project Authors`) declares **no Reserved Font Name**, so subsetting or converting would be permitted. The files are nevertheless shipped exactly as upstream publishes them, unmodified.
- The CSS `font-family` names `Geist` and `Geist Mono` are the families' own names; no modified font software is distributed.

## Integrity

SHA-256 of the files as shipped:

    2ffebe993e969069a9789d15164b7715d42491b5835516c5e3b935d5f81b05f1  Geist-Variable.woff2
    afaacc4c5fbba89d2ebf7a02dc4070208540874592a5504d57175782fe893101  GeistMono-Variable.woff2

Weight: 141 KB for both (the previous pairing was 144 KB).

## Icons

Lucide icons (ISC licence, `lucide-static` 1.74.0, https://lucide.dev) are inlined as SVG at build time by `src/components/Icon.astro`. Ten icons are used, all decorative. Nothing is loaded at runtime.
