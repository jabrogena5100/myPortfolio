# Review gallery

Screenshots are Chromium via Playwright 1.65.1, taken from the production build by `scripts/e2e.sh`. **Owner sign-off: not done.** Everything on the site is now built; Phase 6 is the full responsive, accessibility and performance pass.

## Phase 3: homepage and shared layout (2026-11-17)

| Width | Full page |
| --- | --- |
| Desktop 1440 px | ![](screenshots/phase3/home-desktop.png) |
| Tablet 820 px | ![](screenshots/phase3/home-tablet.png) |
| Phone 390 px | ![](screenshots/phase3/home-phone.png) |

Phone, by section (readable scale): [hero](screenshots/phase3/home-phone-hero.png), [services](screenshots/phase3/home-phone-services.png), [projects](screenshots/phase3/home-phone-projects.png), [verify](screenshots/phase3/home-phone-verify.png), [capabilities](screenshots/phase3/home-phone-capabilities.png).

### Defects found by looking at the screenshots (not by the automated tests), and fixed

1. Section headings rendered at body size: the CSS selector targeted a direct child, but the heading sits inside `.section-head`.
2. Project cards had unequal heights on desktop.
3. Evidence lists had no bullet markers (Tailwind's reset removed them).
4. At 820 px the three cards were squeezed into narrow columns and "Wildfire monitoring" wrapped badly; three columns now start at 1024 px, so tablet stacks them.

### Defect found by the automated checks, and fixed

Links inside running text had no underline (Tailwind's reset removes it), so they were distinguishable by colour only (axe `link-in-text-block`, 3 pages). Links are underlined globally now.

### Look at these (judgement calls for the owner)

- The hero headline is long (four lines on desktop). Shorter is possible but would lose "retries and failure".
- Section headings are modest in size by design; say if you want a larger editorial scale.
- Cards are the only boxed elements. Services and capabilities are ruled lists on purpose.
- The accent is used for the hero rule, primary button, numerals and card hover. Sage is used only for status lines and the verification terms.
- The mobile menu is a native `<details>` panel labelled "Menu".

### Not checked

Real devices; Firefox and WebKit; a screen-reader walkthrough; forced-colors mode; 200 percent zoom (only 320 to 1440 px layouts were captured); Lighthouse; the mobile menu's visual appearance (its behaviour is tested, and `home-phone-menu-open.png` is not meaningful because the menu was closed at capture time); external links (none exist yet); every non-home page (placeholders).

## Phase 4: case studies and the projects index (2026-11-17)

Full pages are 10,000 to 15,000 px tall, so each element was also captured on its own (`screenshots/phase4/crops/`, 48 files) so it could be read at normal size.

| Page | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Projects index | [full](screenshots/phase4/projects-desktop.png) | [full](screenshots/phase4/projects-tablet.png) | [full](screenshots/phase4/projects-phone.png) |
| RyuStoreFront | [full](screenshots/phase4/projects-ryustorefront-desktop.png) | [full](screenshots/phase4/projects-ryustorefront-tablet.png) | [full](screenshots/phase4/projects-ryustorefront-phone.png) |
| Wildfire monitoring | [full](screenshots/phase4/projects-wildfire-monitoring-desktop.png) | [full](screenshots/phase4/projects-wildfire-monitoring-tablet.png) | [full](screenshots/phase4/projects-wildfire-monitoring-phone.png) |
| RyuCloud | [full](screenshots/phase4/projects-ryucloud-desktop.png) | [full](screenshots/phase4/projects-ryucloud-tablet.png) | [full](screenshots/phase4/projects-ryucloud-phone.png) |

Diagrams (desktop): [StoreFront architecture](screenshots/phase4/crops/ryustorefront-desktop-diagram1.png), [order state machine](screenshots/phase4/crops/ryustorefront-desktop-diagram2.png), [RyuCloud architecture](screenshots/phase4/crops/ryucloud-desktop-diagram1.png), [crash recovery](screenshots/phase4/crops/ryucloud-desktop-diagram2.png), [wildfire architecture](screenshots/phase4/crops/wildfire-monitoring-desktop-diagram1.png).
Figures: [Level 2 matrix on its mat](screenshots/phase4/crops/wildfire-monitoring-desktop-figure1.png), [StoreFront listing capture](screenshots/phase4/crops/ryustorefront-desktop-figure1.png). Phone: [header](screenshots/phase4/crops/wildfire-monitoring-phone-header.png), [numeric table](screenshots/phase4/crops/wildfire-monitoring-phone-table3.png), [diagram](screenshots/phase4/crops/ryucloud-phone-diagram1.png).

### Defects found by the automated checks, and fixed

1. Wide tables that scroll sideways on a phone were not keyboard-focusable (axe `scrollable-region-focusable`). Every table is now a named, focusable region.
2. The same defect on the RyuCloud code block (found only after the first fix). Now a named, focusable region.
3. The test run also exposed type errors in my own test code; fixed so `astro check` is clean.

### Defects found by looking at screenshots (the tests could not see these), and fixed

1. Wildfire diagram: "telemetry" touched a box edge and "pose out, image back" sat on top of its arrow. Gap widened and labels moved.
2. RyuCloud crash timeline (the worst one): labels sat on lane lines, the footer text overlapped a box, and an arrow crossed another box. Redrawn with no crossings.
3. RyuCloud architecture: "claim with a lease" was clipped at the right edge, and "playback" sat on the dashed upload line.
4. StoreFront architecture: "signed webhook" collided with its arrow and "claims events" sat on a line.
5. Labels now carry a thin background-coloured halo so a line passing behind them cannot make them unreadable.
6. Phone: numbers in the wildfire tables wrapped inside narrow columns ("177.1 plus or minus 7.0" split over lines). Numeric tables now keep their columns and scroll, with a visible hint and a caption that stays in place.
7. Phone: the "Built" and "Not built" tables crammed long lists into two narrow columns. They are now two stacked blocks on a phone.
8. Prose lists had no bullets or numbers (the CSS reset removed them). Restored, with accent-coloured markers.
9. Phone: the long status line was too large. Smaller below 768 px.
10. Diagrams that scroll sideways on a phone had no cue. A hint now appears below 768 px.

### Look at these (judgement calls for the owner)

- **Length.** The case studies are long (about 10,000 to 15,000 px). They follow the 8-section template, but collapsing "Evidence" into expandable groups is possible if you want shorter pages. I did not, so nothing is hidden by default.
- **Light mats.** The six wildfire figures were drawn on white, in blue and orange, which fight the warm dark palette. I framed them on a light mat (`--color-plate`) with a "Report figure" label rather than alter your charts. Redrawing them in the site palette is possible from the recorded numbers.
- **Screenshot honesty.** Every StoreFront image is labelled "Real API data" or "Fixture data". The "real" listing shows 100 products, not the 49,507 in older notes.
- **Status wording.** "Documented" is a fourth label next to Run, User-reported and Not run. It is used for the wildfire results, which I quote but did not re-run.
- **Phone diagrams.** They scroll sideways rather than reflow. Redrawing a vertical phone layout for each is possible if you prefer.

### Not checked

Real devices; Firefox and WebKit; a screen-reader walkthrough; forced-colors mode; 200 percent zoom; Lighthouse; whether the cross-document page transition behaves; the Services, About and Contact pages (placeholders); external links (none exist).

## Phase 5: services, about, contact (2026-11-17)

| Page | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Services | [full](screenshots/phase5/services-desktop.png) | [full](screenshots/phase5/services-tablet.png) | [full](screenshots/phase5/services-phone.png) |
| About | [full](screenshots/phase5/about-desktop.png) | [full](screenshots/phase5/about-tablet.png) | [full](screenshots/phase5/about-phone.png) |
| Contact | [full](screenshots/phase5/contact-desktop.png) | [full](screenshots/phase5/contact-tablet.png) | [full](screenshots/phase5/contact-phone.png) |

### Defects found, and fixed

1. **Services was 7,693 px tall** because it repeated the full evidence blocks that the case studies already contain. Evidence lines are now the one-line form with status and date, and a pointer to the case study for setup and caveats (5,981 px).
2. **The contact intro said "details are being added" even once details were supplied.** Found by temporarily filling the contact data with fake values and building; now conditional.
3. Wording I softened before it went live: a personality claim ("likes the parts where things go wrong") that you had not given me, an attribution of every audit to the AI reviewer (the evidence names it for the split-leakage audit only), and a promise on your behalf about who runs AWS commands.

### Look at these (judgement calls for the owner)

- The **How I work** text is a draft from the evidence plus your answers. Please confirm each line, especially the GPU-budget sentence: the wildfire notes call the budget "autonomous", and I did not claim who launched the jobs.
- The **contact page is narrow and centred** on purpose (one reading column); the other pages use the full width.
- **Services is still long** (about 6,000 px at desktop). The three services each have what, how, evidence and limits.
- **Contact and resume are placeholders** ("To be added."). See the README for the one place to fill them in.

### Not checked

Real devices; Firefox and WebKit; a screen-reader walkthrough; forced-colors mode; 200 percent zoom; Lighthouse.
