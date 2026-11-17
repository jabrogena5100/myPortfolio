# myPortfolio

Joshua Abrogena's software engineering portfolio: a static Astro site documenting three projects with their evidence.

## Develop (Node runs in Docker; no host Node needed)

```
scripts/web.sh npm install
scripts/web.sh npm run check
scripts/web.sh npm run build        # output in dist/
TTY_FLAGS=-it scripts/web.sh npm run dev   # http://localhost:4321
```

## Layout

- `src/` site source; `src/styles/tokens.css` is the only place design values live
- `content/evidence/` per-project evidence (separate from site copy)
- `docs/` decisions, verification log, content plan
- `design/` anti-slop checklist, tokens spec, component notes, review gallery

Status and decisions: `docs/decisions.md`. Every verification result, including what was not run: `docs/verification.md`.
