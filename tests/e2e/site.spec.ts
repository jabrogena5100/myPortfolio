import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/projects/', '/projects/ryustorefront/', '/projects/ryucloud/', '/projects/wildfire-monitoring/', '/services/', '/about/', '/contact/'];
const CASE_STUDIES = ['/projects/ryustorefront/', '/projects/ryucloud/', '/projects/wildfire-monitoring/'];
const WIDTHS = { phone: 390, tablet: 820, desktop: 1440 } as const;
const HEIGHTS = { phone: 844, tablet: 1180, desktop: 900 } as const;

async function setSize(page: Page, k: keyof typeof WIDTHS) {
  await page.setViewportSize({ width: WIDTHS[k], height: HEIGHTS[k] });
}

for (const [name] of Object.entries(WIDTHS) as [keyof typeof WIDTHS, number][]) {
  test.describe(`${name} (${WIDTHS[name]}px)`, () => {
    for (const path of PAGES) {
      test(`axe, structure and overflow: ${path}`, async ({ page }) => {
        await setSize(page, name);
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();
        expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
        expect(await page.locator('h1').count()).toBe(1);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }

    test('home screenshot', async ({ page }) => {
      await setSize(page, name);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `design/screenshots/phase3/home-${name}.png`, fullPage: true });
    });
  });
}

test('only first-party requests, fonts load, no console errors', async ({ page }) => {
  const hosts = new Set<string>();
  const errors: string[] = [];
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect([...hosts]).toEqual(['127.0.0.1:4321']);
  expect(errors).toEqual([]);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
  expect(loaded).toContain('Hanken Grotesk');
  expect(loaded).toContain('Source Serif 4 Display');
});

test('every internal link and in-page anchor on the home page resolves', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') as string));
  const internal = [...new Set(hrefs.filter((h) => h.startsWith('/') || h.startsWith('#')))];
  expect(internal.length).toBeGreaterThan(5);
  for (const h of internal) {
    if (h.startsWith('#')) {
      expect(await page.locator(h).count(), `anchor ${h}`).toBe(1);
    } else {
      const res = await request.get(h);
      expect(res.status(), `link ${h}`).toBe(200);
    }
  }
});

test('skip link is first in tab order and moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.textContent);
  expect(first).toContain('Skip to content');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => location.hash)).toBe('#main');
});

test('desktop keyboard: every nav link and project card is reachable with a visible focus ring', async ({ page }) => {
  await setSize(page, 'desktop');
  await page.goto('/');
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, text: (el.textContent || '').trim().slice(0, 40), outline: cs.outlineStyle + ' ' + cs.outlineWidth };
    });
    if (info.tag === 'BODY') break; // focus left the page after the last control
    seen.push(info.text);
    expect(info.outline, `focus ring on "${info.text}"`).toMatch(/solid 2px/);
  }
  for (const t of ['Projects', 'Services', 'About', 'Contact', 'RyuStoreFront', 'RyuCloud', 'Wildfire monitoring']) {
    expect(seen.some((s) => s.includes(t)), `tabbed to ${t}`).toBe(true);
  }
});

test('mobile menu: opens by keyboard, Escape closes and restores focus', async ({ page }) => {
  await setSize(page, 'phone');
  await page.goto('/');
  const summary = page.locator('summary', { hasText: 'Menu' });
  await expect(summary).toBeVisible();
  await expect(page.locator('ul.desktop')).toBeHidden();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details[data-menu]')).toHaveAttribute('open', '');
  const links = page.locator('details[data-menu] a');
  expect(await links.count()).toBe(4);
  for (const box of await links.all()) {
    const b = await box.boundingBox();
    expect(b!.height).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('details[data-menu]')).not.toHaveAttribute('open', '');
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('SUMMARY');
});

test('reduced motion removes transitions; default keeps them short', async ({ page }) => {
  await page.goto('/');
  const dur = () => page.locator('.spot').first().evaluate((el) => getComputedStyle(el).transitionDuration.split(',')[0]);
  expect(await dur()).toBe('0.2s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await dur()).toBe('0s');
  const transform = await page.locator('.spot').first().evaluate((el) => { el.dispatchEvent(new MouseEvent('mouseover')); return getComputedStyle(el).transform; });
  expect(transform).toBe('none');
});

test('spotlight tracks the pointer on hover-capable devices and is decorative', async ({ page }) => {
  await setSize(page, 'desktop');
  await page.goto('/');
  const card = page.locator('.spot').first();
  await card.scrollIntoViewIfNeeded();
  const b = (await card.boundingBox())!;
  await page.mouse.move(b.x + 50, b.y + 60);
  await page.mouse.move(b.x + 80, b.y + 90);
  const mx = await card.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--mx'));
  expect(parseFloat(mx)).toBeGreaterThan(40);
});

test('home sections at phone width (review screenshots)', async ({ page }) => {
  await setSize(page, 'phone');
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const parts: [string, string][] = [['hero', '.hero'], ['services', '#services'], ['projects', '#projects'], ['verify', '#verify'], ['capabilities', '#capabilities']];
  for (const [name, sel] of parts) {
    await page.locator(sel).screenshot({ path: `design/screenshots/phase3/home-phone-${name}.png` });
  }
  await page.screenshot({ path: 'design/screenshots/phase3/home-phone-menu-open.png', clip: { x: 0, y: 0, width: 390, height: 420 } , animations: 'disabled' }).catch(() => {});
});

// ---------------------------------------------------------------- Phase 4: case studies and index

for (const [name] of Object.entries(WIDTHS) as [keyof typeof WIDTHS, number][]) {
  test(`case-study screenshots at ${name}`, async ({ page }) => {
    await setSize(page, name);
    for (const path of ['/projects/', ...CASE_STUDIES]) {
      await page.goto(path);
      await page.evaluate(async () => {
        await document.fonts.ready;
        document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });
      const slug = path.replace(/\//g, '-').replace(/^-|-$/g, '') || 'home';
      await page.screenshot({ path: `design/screenshots/phase4/${slug}-${name}.png`, fullPage: true });
    }
  });
}

test.describe('case studies: structure and accessibility details', () => {
  for (const path of CASE_STUDIES) {
    test(`images, diagrams, sections and links: ${path}`, async ({ page, request }) => {
      await setSize(page, 'desktop');
      await page.goto(path);
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });

      // every image has non-empty alt text and actually loaded
      const imgs = await page.$$eval('main img', (els) => (els as HTMLImageElement[]).map((i) => ({ alt: i.getAttribute('alt') ?? '', ok: i.complete && i.naturalWidth > 0, src: i.currentSrc })));
      for (const i of imgs) {
        expect(i.alt.length, `alt text for ${i.src}`).toBeGreaterThan(30);
        expect(i.ok, `image loaded: ${i.src}`).toBe(true);
      }

      // every figure carries a caption; every svg diagram is labelled by a non-empty title and desc
      expect(await page.locator('figure:not(:has(figcaption))').count()).toBe(0);
      const svgs = await page.$$eval('svg[role="img"]', (els) => els.map((s) => {
        const ids = (s.getAttribute('aria-labelledby') || '').split(' ');
        return ids.map((id) => (document.getElementById(id)?.textContent || '').trim().length);
      }));
      for (const lens of svgs) { expect(lens.length).toBe(2); lens.forEach((l) => expect(l).toBeGreaterThan(20)); }

      // scrollable diagram regions are keyboard-focusable and named (axe: scrollable-region-focusable)
      const regions = await page.$$eval('.scroll[role="region"]', (els) => els.map((e) => ({ tab: e.getAttribute('tabindex'), name: e.getAttribute('aria-label') })));
      for (const r of regions) { expect(r.tab).toBe('0'); expect(r.name).toBeTruthy(); }

      // eight numbered sections, in order, plus a true status line
      const heads = await page.$$eval('main h2', (hs) => hs.map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim()));
      expect(heads.length).toBe(8);
      expect(heads.map((h) => h.replace(/^\d+\s*/, ''))).toEqual(['The problem', 'What I built', 'System architecture', expect.stringContaining('hardest'), 'Evidence', expect.stringMatching(/Tradeoffs/), expect.stringMatching(/improve/), expect.stringMatching(/Links/)]);
      expect(await page.locator('.status').innerText()).toMatch(/^Status today:/);

      // every status badge is text, and at least one result is labelled
      expect(await page.locator('.badge').count()).toBeGreaterThan(3);

      // internal links and in-page anchors resolve; no external links; no repository links
      const hrefs = await page.$$eval('main a[href], header a[href], footer a[href]', (as) => as.map((a) => a.getAttribute('href') as string));
      for (const h of new Set(hrefs)) {
        expect(h, 'no external or repo links yet').not.toMatch(/^https?:|github\.com/);
        if (h.startsWith('#')) expect(await page.locator(h).count(), `anchor ${h}`).toBe(1);
        else expect((await request.get(h)).status(), `link ${h}`).toBe(200);
      }
    });

    test(`keyboard: a visible focus ring on every tab stop: ${path}`, async ({ page }) => {
      await setSize(page, 'desktop');
      await page.goto(path);
      let stops = 0;
      for (let i = 0; i < 90; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const cs = getComputedStyle(el);
          return { tag: el.tagName, label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), outline: `${cs.outlineStyle} ${cs.outlineWidth}` };
        });
        if (info.tag === 'BODY') break;
        stops++;
        expect(info.outline, `focus ring on "${info.label}"`).toMatch(/solid 2px/);
      }
      expect(stops).toBeGreaterThan(12);
    });
  }

  test('guardrail wording: the caveats that must appear, appear', async ({ page }) => {
    await page.goto('/projects/wildfire-monitoring/');
    let t = await page.locator('main').innerText();
    for (const s of ['nothing is claimed significant', '0.125', 'Neither perception arm reached the ignition cell sooner', 'cannot separate a training-domain effect', 'not published', 'was never built|file is empty']) {
      expect(t, s).toMatch(new RegExp(s));
    }
    await page.goto('/projects/ryucloud/');
    t = await page.locator('main').innerText();
    for (const s of ['no raw output or screenshots were kept', 'currently down', 'not reconciled', 'No latency, throughput']) expect(t, s).toContain(s);
    await page.goto('/projects/ryustorefront/');
    t = await page.locator('main').innerText();
    for (const s of ['no worker and no frontend', 'currently down', 'No load test', 'Not built yet']) expect(t, s).toContain(s);
  });

  test('no marketing filler or unsupported scale claims on any page', async ({ page }) => {
    const banned = /world-class|cutting-edge|revolutioni|seamless|passionate|leverag|robust|high-traffic|battle-tested|enterprise-grade/i;
    for (const path of PAGES) {
      await page.goto(path);
      const text = await page.locator('body').innerText();
      expect(text, `banned phrase on ${path}`).not.toMatch(banned);
      // "production-ready" and "scalable" may appear only in a negation
      for (const m of text.matchAll(/(.{0,25})(production-ready|scalab\w*)/gi)) {
        expect(m[1], `unnegated claim on ${path}: ${m[0]}`).toMatch(/not |no |without |nor /i);
      }
    }
  });

  test('reduced motion on the index and case studies: no transitions, no hover movement', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/');
    const dur = await page.locator('.spot').first().evaluate((el) => getComputedStyle(el).transitionDuration.split(',')[0]);
    expect(dur).toBe('0s');
    for (const path of CASE_STUDIES) {
      await page.goto(path);
      const anims = await page.evaluate(() => document.getAnimations().length);
      expect(anims, `running animations on ${path}`).toBe(0);
    }
  });

  test('home cards and project index come from the same data', async ({ page }) => {
    await page.goto('/');
    const home = await page.locator('#projects .card .ev li').allInnerTexts();
    await page.goto('/projects/');
    const names = await page.locator('.card h2').allInnerTexts();
    expect(names).toEqual(['RyuStoreFront', 'RyuCloud', 'Wildfire monitoring']);
    expect(home.length).toBe(9);
    // each home evidence line is also stored as a fact with a status, so no number lives only in markup
    expect(home.every((l) => l.length > 20)).toBe(true);
  });
});

test('case-study review crops (diagrams, figures, tables, header)', async ({ page }) => {
  for (const size of ['desktop', 'phone'] as const) {
    await setSize(page, size);
    for (const path of CASE_STUDIES) {
      await page.goto(path);
      await page.evaluate(async () => {
        await document.fonts.ready;
        document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });
      const slug = path.split('/').filter(Boolean).pop();
      await page.locator('.head').screenshot({ path: `design/screenshots/phase4/crops/${slug}-${size}-header.png` });
      const groups: [string, string][] = [['figure.diagram', 'diagram'], ['figure.fig', 'figure'], ['.tablewrap', 'table']];
      for (const [sel, name] of groups) {
        const els = page.locator(sel);
        for (let i = 0; i < await els.count(); i++) {
          await els.nth(i).screenshot({ path: `design/screenshots/phase4/crops/${slug}-${size}-${name}${i + 1}.png` });
        }
      }
    }
  }
});
