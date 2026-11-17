# Anti-slop design checklist

Written before any component, as required. Every component and page is reviewed against this list during Phase 6, and the result goes in `design/REVIEW.md`. An item is checked only after someone has looked at a real screenshot.

## A. Content (the biggest source of slop)

- [ ] Every claim maps to a row in `content/evidence/*` or `docs/content-plan.md`. No exceptions.
- [ ] No filler phrases: "world-class", "cutting-edge", "revolutionizing", "passionate", "seamless", "leverage", "robust", "scalable" (unless a measurement is cited next to it).
- [ ] No lorem ipsum and no "Welcome to my portfolio".
- [ ] Every number carries its context: unit, dataset or setup, date, and whether it was run, user-reported or documented.
- [ ] Status lines say what is true today (for example "deployed once, then destroyed"), not what is planned.
- [ ] Planned features are labelled planned. Nothing silently becomes "done".
- [ ] No fake testimonials, customers, company logos, skill percentages, GitHub activity stats, review counts or "years of experience" invented numbers.
- [ ] No claim of clients, revenue, users or scale.
- [ ] Headlines say something specific; they could not be pasted onto another person's site.

## B. Visual

- [ ] Palette from `design/TOKENS.md` only. No colour literal outside the token file. No default Tailwind palette.
- [ ] No dominant navy or blue; no neon blue or purple gradient; no gradient text.
- [ ] One accent (copper). Sage only as a quiet secondary for "verified" or status text.
- [ ] No glassmorphism, blur panels, glowing orbs or particle backgrounds.
- [ ] No fake terminal windows, fake code editors or window chrome used as decoration.
- [ ] No stock photos, abstract 3D renders or AI-generated art.
- [ ] No emoji as icons. One icon set, used sparingly; text labels preferred.
- [ ] Spacing from the spacing scale, not ad hoc values.
- [ ] Type: two families at most; a scale of 7 sizes or fewer; line length 60 to 75 characters for reading text.
- [ ] Cards are used only where an item is a clickable unit (project cards). Lists are lists. Not every block is a rounded box.
- [ ] No three-icon feature row, no centred-hero-with-two-buttons template.
- [ ] Diagrams are legible at 360 px width or are scrollable with a visible hint; text in diagrams is at least 14 px equivalent.
- [ ] Screenshots are real, labelled for what they show (mock data or real data), and contain no personal information.

## C. Motion

- [ ] Motion is CSS only unless a written justification is added to `docs/decisions.md`.
- [ ] Entrance and hover motion uses opacity and a small translate; durations 120 to 240 ms from the motion tokens.
- [ ] `prefers-reduced-motion: reduce` removes all non-essential motion; verified by a Playwright test.
- [ ] Nothing animates on page load that delays reading or layout (no loading spinners, no skeletons for static content, no blocking intro).
- [ ] No parallax, no scroll-jacking, no scroll-triggered 3D tilt.
- [ ] Pointer spotlight runs only on `(hover: hover)` devices and never carries information.
- [ ] Hover and focus states are equivalent: anything a hover reveals is also reachable by keyboard focus.

## D. Accessibility

- [ ] Text contrast at least 4.5:1 (3:1 for large text and UI borders that carry meaning), computed, per `design/TOKENS.md`.
- [ ] Visible focus ring on every interactive element, at least 3:1 against its background.
- [ ] Skip-to-content link; one `h1` per page; landmarks (`header`, `nav`, `main`, `footer`).
- [ ] Mobile menu works by keyboard, closes on Escape, restores focus.
- [ ] Touch targets at least 44 by 44 px.
- [ ] Every image has meaningful alt text or is marked decorative; diagrams have a text description.
- [ ] Links have distinguishable text, underlined in running text (axe `link-in-text-block`).
- [ ] Information is never conveyed by colour alone (status badges carry text).
- [ ] Works at 200 percent zoom and 320 px width with no horizontal page scroll.
- [ ] axe: zero detectable violations on every page at three widths (goal; result recorded honestly in `docs/verification.md`).

## E. Performance and engineering

- [ ] Static pages ship zero JavaScript by default; every island justified.
- [ ] Fonts self-hosted, at most two families, `font-display: swap`, subset where possible. No third-party tracking, analytics or cookie banner.
- [ ] Images responsive (`srcset`), width and height set, below-the-fold lazy, hero not lazy.
- [ ] No broken internal or external links (checked, not assumed).
- [ ] Page titles and descriptions unique; Open Graph tags present; sitemap generated.
- [ ] Lighthouse results recorded as measured; not claimed before they are run.

## F. Provenance of borrowed ideas

- [ ] No code copied from 21st.dev or elsewhere without a verified licence. Inspiration is credited in `design/COMPONENT-NOTES.md`.
- [ ] Real dataset imagery (Boreal, FireMan, FASDD) is not redistributed (licences require attribution and checks).
