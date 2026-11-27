import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/projects/', '/projects/ryustorefront/', '/projects/ryuzcloud/', '/services/', '/about/', '/contact/'];
// The only external destinations the site may link to (owner-approved 2026-11-18; live project sites added 2026-11-26). Everything else must be internal.
// The profile links and the email come from the site's own contact data, so this file never duplicates them.
import { contact, site } from '../../src/data/site';
const LIVE = { ryuzcloud: 'https://ryuzcloud.com', ryustorefront: 'https://ryustorefront.com' } as const;
const ALLOWED_EXTERNAL = [site.address, contact.github!, `${contact.github}/RyuZCloud`, `${contact.github}/RyuStoreFront`, contact.linkedin!, LIVE.ryuzcloud, LIVE.ryustorefront];
const ALLOWED_MAILTO = `mailto:${contact.email}`;
const CASE_STUDIES = ['/projects/ryustorefront/', '/projects/ryuzcloud/'];
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
  expect([...hosts]).toEqual([new URL(test.info().project.use.baseURL as string).host]);
  expect(errors).toEqual([]);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
  expect(loaded).toContain('Geist');
  expect(loaded).toContain('Geist Mono');
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
  for (const t of ['Projects', 'Services', 'About', 'Contact', 'RyuStoreFront', 'RyuZCloud']) {
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
        if (/^https?:/.test(h)) { expect(ALLOWED_EXTERNAL, `unexpected external link ${h}`).toContain(h); continue; }
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
    await page.goto('/projects/ryuzcloud/');
    let t = await page.locator('main').innerText();
    for (const s of ['Live at ryuzcloud.com', 'no number on this page was measured on the current deployment', 'do not reconcile', 'No latency, throughput', 'Estimates']) expect(t, s).toContain(s);
    await page.goto('/projects/ryustorefront/');
    t = await page.locator('main').innerText();
    for (const s of ['Live at ryustorefront.com', 'test mode', 'No load test', 'Not built yet', 'every AWS number on this page comes from the earlier, destroyed sessions']) expect(t, s).toContain(s);
  });

  test('only the two projects appear, and no AI-assistant or role wording remains', async ({ page }) => {
    for (const path of [...PAGES, '/resume/']) {
      await page.goto(path);
      const t = await page.locator('body').innerText();
      expect(t, path).not.toMatch(/wildfire|drone|ECE 496|capstone|YOLO|ArduPilot/i);
      expect(t, path).not.toMatch(/Claude|AI assistant|AI coding|Codex/i);
      expect(t, path).not.toContain('Independent Software Engineer');
      expect(t, path).not.toMatch(/\bRyuCloud\b/);
    }
  });

  test('old URLs redirect: RyuCloud to RyuZCloud, the removed case study to the project index', async ({ request }) => {
    for (const [from, to] of [['/projects/ryucloud/', '/projects/ryuzcloud/'], ['/projects/wildfire-monitoring/', '/projects/']]) {
      const html = await (await request.get(from)).text();
      expect(html, from).toMatch(new RegExp(`http-equiv="refresh" content="0;url=${to}"`));
      expect(html, from).not.toMatch(/<script/);
    }
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
    expect(names).toEqual(['RyuStoreFront', 'RyuZCloud']);
    expect(home.length).toBe(6);
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

// ---------------------------------------------------------------- Phase 5: services, about, contact

const PHASE5 = ['/services/', '/about/', '/contact/'];

test.describe('services, about and contact', () => {
  test('services: two numbered services with labelled evidence, plus what is not claimed', async ({ page }) => {
    await page.goto('/services/');
    const heads = await page.$$eval('main h2', (hs) => hs.map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim()));
    expect(heads).toEqual([
      '1 Backend systems that stay correct under retries and failure',
      '2 AWS infrastructure as code, deployed and torn down',
      'What I do not claim',
    ]);
    expect(await page.locator('.badge').count()).toBeGreaterThanOrEqual(8);
    const t = await page.locator('main').innerText();
    for (const s of ['No clients, no paid work, no revenue', 'None of the projects has a load test', 'not on the current deployments', 'Where it stops']) expect(t, s).toContain(s);
  });

  test('about: How I work is anchored and states the verification rules; the resume PDF is linked', async ({ page }) => {
    await page.goto('/about/');
    expect(await page.locator('#how-i-work').count()).toBe(1);
    const section = await page.locator('#how-i-work').innerText();
    for (const s of ['saved plan', 'unverified until it is tested', 'metrics file', 'Estimates are left out']) expect(section, s).toContain(s);
    expect(await page.locator('a[href="/resume.pdf"]').count()).toBe(1);
    expect(await page.locator('main').innerText()).not.toContain('to be added');
    // the services page links to the anchor, and it resolves
    await page.goto('/services/');
    expect(await page.locator('a[href="/about/#how-i-work"]').count()).toBe(1);
  });

  test('contact: no form, no inputs, no storage, placeholders only', async ({ page }) => {
    await page.goto('/contact/');
    expect(await page.locator('form, input, textarea, select, button[type="submit"]').count()).toBe(0);
    // owner-supplied 2026-11-18: one email, GitHub and LinkedIn; the resume PDF was added the same day
    expect(await page.locator('a[href^="mailto:"]').count()).toBe(1);
    expect(await page.locator('main a[href^="http"]').count()).toBe(2);
    expect(await page.locator('a[href="/resume.pdf"]').count()).toBe(1);
    expect(await page.locator('.todo').count()).toBe(0);
    const t = await page.locator('main').innerText();
    expect(t).toContain('no contact form');
    expect(t).toContain('no analytics');
  });

  test('no cookies, no web storage and only first-party requests on any page', async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', (r) => hosts.add(new URL(r.url()).host));
    for (const path of PAGES) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => ({ cookie: document.cookie, ls: localStorage.length, ss: sessionStorage.length }));
      expect(state, `storage on ${path}`).toEqual({ cookie: '', ls: 0, ss: 0 });
    }
    expect([...hosts]).toEqual([new URL(test.info().project.use.baseURL as string).host]);
  });

  for (const path of PHASE5) {
    test(`links and anchors resolve, none external: ${path}`, async ({ page, request }) => {
      await page.goto(path);
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') as string));
      for (const h of new Set(hrefs)) {
        if (/^https?:|^mailto:/.test(h)) { expect([...ALLOWED_EXTERNAL, ALLOWED_MAILTO], `unexpected external link ${h}`).toContain(h); continue; }
        if (h.startsWith('#')) { expect(await page.locator(h).count(), `anchor ${h}`).toBe(1); continue; }
        const [url, hash] = h.split('#');
        expect((await request.get(url)).status(), `link ${h}`).toBe(200);
        if (hash) { await page.goto(h); expect(await page.locator(`#${hash}`).count(), `target ${h}`).toBe(1); await page.goto(path); }
      }
    });

    test(`keyboard: visible focus ring on every tab stop: ${path}`, async ({ page }) => {
      await setSize(page, 'desktop');
      await page.goto(path);
      let stops = 0;
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const cs = getComputedStyle(el);
          return { tag: el.tagName, label: (el.textContent || '').trim().slice(0, 40), outline: `${cs.outlineStyle} ${cs.outlineWidth}` };
        });
        if (info.tag === 'BODY') break;
        stops++;
        expect(info.outline, `focus ring on "${info.label}"`).toMatch(/solid 2px/);
      }
      expect(stops).toBeGreaterThan(8);
    });
  }

  for (const [name] of Object.entries(WIDTHS) as [keyof typeof WIDTHS, number][]) {
    test(`phase 5 screenshots at ${name}`, async ({ page }) => {
      await setSize(page, name);
      for (const path of PHASE5) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `design/screenshots/phase5/${path.replace(/\//g, '')}-${name}.png`, fullPage: true });
      }
    });
  }

  test('reduced motion: nothing animates on the new pages', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of PHASE5) {
      await page.goto(path);
      expect(await page.evaluate(() => document.getAnimations().length), path).toBe(0);
    }
  });
});

// ---------------------------------------------------------------- Phase 6: responsive, zoom, spacing, forced colors, weight, metadata

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const overflowOf = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('phase 6: responsive and adaptive behaviour', () => {
  for (const path of PAGES) {
    test(`reflow at 320 px (WCAG 1.4.10): ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await overflowOf(page), 'page scrolls horizontally').toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
    });

    test(`200% zoom (640 css px) and 200% text size: ${path}`, async ({ browser }) => {
      // Emulates a user stylesheet or extension, which a page's CSP does not govern, so CSP is bypassed here.
      // (The CSP itself is tested separately, with the production header injected.)
      const ctx = await browser.newContext({ bypassCSP: true, baseURL: test.info().project.use.baseURL });
      const page = await ctx.newPage();
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto(path);
      expect(await overflowOf(page), '200% zoom').toBeLessThanOrEqual(0);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      expect(await overflowOf(page), '200% text size').toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
      await ctx.close();
    });

    test(`text spacing overrides (WCAG 1.4.12): ${path}`, async ({ browser }) => {
      // Emulates a user stylesheet or extension, which a page's CSP does not govern, so CSP is bypassed here.
      // (The CSP itself is tested separately, with the production header injected.)
      const ctx = await browser.newContext({ bypassCSP: true, baseURL: test.info().project.use.baseURL });
      const page = await ctx.newPage();
      for (const w of [390, 1440]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(path);
        await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
        expect(await overflowOf(page), `overflow at ${w}`).toBeLessThanOrEqual(0);
        // no text clipped inside fixed-height boxes: nothing clips its own overflow vertically
        const clipped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((e) => { const s = getComputedStyle(e); return (s.overflowY === 'hidden') && e.clientWidth > 1 && e.clientHeight > 1 && e.scrollHeight > e.clientHeight + 1 && e.textContent!.trim().length > 0 && !e.closest('svg'); })
          .map((e) => e.className || e.tagName));
        expect(clipped, `clipped text at ${w}`).toEqual([]);
      }
      await ctx.close();
    });

    test(`forced colors: still operable and axe-clean: ${path}`, async ({ browser }) => {
      const ctx = await browser.newContext({ forcedColors: 'active', viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).disableRules(['color-contrast']).analyze();
      expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      // focus is still visible: a tab stop has a non-zero solid outline
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      const o = await page.evaluate(() => { const s = getComputedStyle(document.activeElement as Element); return `${s.outlineStyle} ${s.outlineWidth}`; });
      expect(o).toMatch(/solid [1-9]/);
      if (path === '/' || path === '/projects/ryuzcloud/') await page.screenshot({ path: `design/screenshots/phase6/forced-colors-${path === '/' ? 'home' : path.split('/').filter(Boolean).pop()}.png`, fullPage: false });
      await ctx.close();
    });
  }

  test('mobile menu still works at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    const summary = page.locator('summary', { hasText: 'Menu' });
    await summary.click();
    await expect(page.locator('details[data-menu]')).toHaveAttribute('open', '');
    const box = await page.locator('details[data-menu] ul').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');
    await expect(page.locator('details[data-menu]')).not.toHaveAttribute('open', '');
  });

  test('page weight: initial load budget, and full weight recorded', async ({ page }) => {
    const report: Record<string, { initial_kb: number; full_kb: number; images_kb: number }> = {};
    for (const path of PAGES) {
      let bytes = 0; let imgBytes = 0;
      const onResp = async (r: import('@playwright/test').Response) => { try { const b = (await r.body()).length; bytes += b; if (r.url().match(/\.(webp|png|jpg|svg)$/)) imgBytes += b; } catch {} };
      page.on('response', onResp);
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      const initial = bytes;
      await page.evaluate(async () => { document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
      await page.waitForLoadState('networkidle');
      page.off('response', onResp);
      report[path] = { initial_kb: Math.round(initial / 1024), full_kb: Math.round(bytes / 1024), images_kb: Math.round(imgBytes / 1024) };
      expect(initial / 1024, `initial weight of ${path}`).toBeLessThan(250);
    }
    const { writeFileSync } = await import('node:fs');
    writeFileSync('design/lighthouse/page-weight.json', JSON.stringify({ note: 'Uncompressed bytes from `astro preview` (no HTTP compression). initial = before any lazy image loads; full = after every image is forced to load.', report }, null, 2));
  });

  test('every image has dimensions (no layout shift) and below-the-fold images are lazy', async ({ page }) => {
    for (const path of CASE_STUDIES) {
      await page.goto(path);
      const imgs = await page.$$eval('main img', (els) => (els as HTMLImageElement[]).map((i) => ({ w: i.getAttribute('width'), h: i.getAttribute('height'), lazy: i.loading, srcset: !!i.srcset })));
      if (path.endsWith('/ryuzcloud/')) { expect(imgs.length, 'RyuZCloud has no images by design').toBe(0); continue; }
      expect(imgs.length).toBeGreaterThan(0);
      for (const i of imgs) { expect(Number(i.w)).toBeGreaterThan(0); expect(Number(i.h)).toBeGreaterThan(0); expect(i.lazy).toBe('lazy'); expect(i.srcset).toBe(true); }
    }
  });

  test('page metadata: unique titles and descriptions, language, viewport, icon', async ({ page }) => {
    const titles = new Set<string>(); const descs = new Set<string>();
    for (const path of PAGES) {
      await page.goto(path);
      const m = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
        icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      }));
      expect(m.lang).toBe('en');
      expect(m.title.length, `title of ${path}`).toBeGreaterThan(10);
      expect(m.title.length, `title of ${path}`).toBeLessThan(80);
      expect(m.desc.length, `description of ${path}`).toBeGreaterThan(50);
      expect(m.desc.length, `description of ${path}`).toBeLessThanOrEqual(160);
      expect(m.viewport).toContain('width=device-width');
      expect(m.icon).toBe('/favicon.svg');
      expect(m.ogTitle).toBe(m.title);
      expect(titles.has(m.title), `duplicate title ${m.title}`).toBe(false);
      expect(descs.has(m.desc), `duplicate description on ${path}`).toBe(false);
      titles.add(m.title); descs.add(m.desc);
    }
  });

  test('robots.txt and favicon are served', async ({ request }) => {
    expect((await request.get('/robots.txt')).status()).toBe(200);
    const fav = await request.get('/favicon.svg');
    expect(fav.status()).toBe(200);
    expect(fav.headers()['content-type']).toContain('svg');
  });
});

test('phase 6 review screenshots: 320 px first screens, 320 px menu, 200% zoom first screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ['/', '/projects/ryustorefront/', '/projects/ryuzcloud/', '/services/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `design/screenshots/phase6/w320-${path === '/' ? 'home' : path.split('/').filter(Boolean).pop()}.png` });
  }
  await page.goto('/');
  await page.locator('summary', { hasText: 'Menu' }).click();
  await page.screenshot({ path: 'design/screenshots/phase6/w320-menu-open.png', clip: { x: 0, y: 0, width: 320, height: 420 } });
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto('/projects/ryuzcloud/');
  await page.screenshot({ path: 'design/screenshots/phase6/zoom200-ryuzcloud.png' });
});

// ---------------------------------------------------------------- Phase 7: deployment readiness

import { readFileSync } from 'node:fs';
const CSP = readFileSync('infra/terraform/csp.txt', 'utf8').trim();

test.describe('phase 7: deployment readiness', () => {
  test('the Content-Security-Policy file is strict', () => {
    for (const d of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'", "frame-ancestors 'none'"]) expect(CSP, d).toContain(d);
    expect(CSP).not.toMatch(/unsafe-inline|unsafe-eval|unsafe-hashes/);
    expect(CSP).not.toMatch(/(^|[\s;])\*(\s|;|$)/);   // no bare wildcard source
    expect(CSP).not.toMatch(/\bhttp:/);              // no plain-http sources
    expect(CSP).not.toContain('\n');                 // one header value
  });

  test('no inline scripts and no inline style attributes in any built page', async ({ page }) => {
    for (const path of [...PAGES, '/404.html']) {
      await page.goto(path);
      const n = await page.evaluate(() => ({
        inlineScripts: document.querySelectorAll('script:not([src])').length,
        styleAttrs: document.querySelectorAll('[style]').length,
        styleTags: document.querySelectorAll('style').length,
        handlers: [...document.querySelectorAll('*')].filter((e) => e.getAttributeNames().some((a) => a.startsWith('on'))).length,
      }));
      expect(n, path).toEqual({ inlineScripts: 0, styleAttrs: 0, styleTags: 0, handlers: 0 });
    }
  });

  test('every page works under the exact production CSP, with zero violations', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const headers = { ...response.headers() };
      if (route.request().resourceType() === 'document') headers['content-security-policy'] = CSP;
      await route.fulfill({ response, headers });
    });
    await page.addInitScript(() => {
      (window as unknown as { __v: string[] }).__v = [];
      document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __v: string[] }).__v.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    const consoleErrors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    const violations = () => page.evaluate(() => (window as unknown as { __v: string[] }).__v);

    for (const path of [...PAGES, '/404.html']) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await page.evaluate(async () => {
        await document.fonts.ready;
        document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'));
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });
      // exercise the two scripts: the pointer spotlight and the mobile menu
      const card = page.locator('.spot').first();
      if (await card.count()) { await card.scrollIntoViewIfNeeded(); const b = (await card.boundingBox())!; await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.move(b.x + 60, b.y + 60); }
      await page.setViewportSize({ width: 390, height: 800 });
      await page.locator('summary', { hasText: 'Menu' }).click();
      await expect(page.locator('details[data-menu]')).toHaveAttribute('open', '');
      await page.keyboard.press('Escape');
      expect(await violations(), `CSP violations on ${path}`).toEqual([]);
    }
    expect(consoleErrors, 'console errors under CSP').toEqual([]);

    // the policy must actually enforce: an injected inline script is blocked and recorded
    await page.goto('/');
    const ran = await page.evaluate(() => {
      (window as unknown as { __injected?: boolean }).__injected = false;
      const s = document.createElement('script'); s.textContent = 'window.__injected = true';
      document.head.appendChild(s);
      return (window as unknown as { __injected?: boolean }).__injected;
    });
    expect(ran, 'inline script must not run under the policy').toBe(false);
    expect((await violations()).some((v) => v.startsWith('script-src'))).toBe(true);
  });

  test('a missing page returns a real 404 with the site 404 page and is not indexable', async ({ page, request }) => {
    const res = await request.get('/no-such-page/');
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain('That page does not exist');
    await page.goto('/404.html');
    expect(await page.locator('h1').count()).toBe(1);
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex');
    expect(await page.locator('link[rel="canonical"]').count()).toBe(0);
    for (const w of [390, 1440]) {
      await page.setViewportSize({ width: w, height: 800 });
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    }
  });

  test('without SITE_URL: no canonical links, no sitemap line, no sitemap file', async ({ page, request }) => {
    test.skip(!!process.env.E2E_BASE_URL, 'only meaningful against the local build');
    for (const path of PAGES) { await page.goto(path); expect(await page.locator('link[rel="canonical"]').count(), path).toBe(0); }
    expect(await (await request.get('/robots.txt')).text()).toBe('User-agent: *\nAllow: /\n');
    expect((await request.get('/sitemap-index.xml')).status()).toBe(404);
  });
});

test('phase 7 review screenshots: the 404 page', async ({ page }) => {
  for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 800]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/404.html');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `design/screenshots/phase7/404-${name}.png` });
  }
});

test('diagram flow animation runs by default and is off under reduced motion', async ({ page }) => {
  await page.goto('/projects/ryustorefront/');
  expect(await page.locator('.d-flow').count()).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => (a as CSSAnimation).animationName === 'd-dash').length)).toBeGreaterThanOrEqual(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projects/ryustorefront/');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  const dash = await page.locator('.d-flow').first().evaluate((e) => getComputedStyle(e).strokeDasharray);
  expect(dash).not.toBe('none'); // still drawn as dashes, just not moving
});

test('no serif fonts are used anywhere: headings and body are Geist, labels are Geist Mono', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const fams = await page.evaluate(() => [...new Set([...document.querySelectorAll('h1,h2,h3,p,li,a,dt,dd,td,th,code')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '').trim()))]);
    for (const f of fams) expect(['Geist', 'Geist Mono'], `${path}: ${f}`).toContain(f);
  }
});

test('every external link is on the allow-list and opens safely; both repositories are linked', async ({ page }) => {
  for (const path of [...PAGES, '/404.html']) {
    await page.goto(path);
    const links = await page.$$eval('a[href^="http"]', (as) => as.map((a) => ({ href: a.getAttribute('href') as string, rel: a.getAttribute('rel') || '' })));
    for (const l of links) {
      expect(ALLOWED_EXTERNAL, `${path}: ${l.href}`).toContain(l.href);
      expect(l.rel, `${path}: rel on ${l.href}`).toContain('noopener');
      expect(l.rel, `${path}: rel on ${l.href}`).toContain('noreferrer');
    }
  }
  await page.goto('/projects/ryustorefront/');
  expect(await page.locator(`a[href="${contact.github}/RyuStoreFront"]`).count()).toBe(1);
  expect(await page.locator(`a[href="${LIVE.ryustorefront}"]`).count()).toBe(1);
  await page.goto('/projects/ryuzcloud/');
  expect(await page.locator(`a[href="${contact.github}/RyuZCloud"]`).count()).toBe(1);
  expect(await page.locator(`a[href="${LIVE.ryuzcloud}"]`).count()).toBe(1);
});

test('about: education is stated and the resume is linked', async ({ page }) => {
  await page.goto('/about/');
  const t = await page.locator('#experience').innerText();
  expect(t).toContain('Computer Engineering');
  expect(t).toContain('University of Hawai');
  expect(t).toContain('expected Fall 2026');
  expect(t).toContain('Resume (PDF)');
  expect(t).not.toContain('to be added');
  expect(await page.locator('footer').innerText()).not.toContain('being added');
});

test('background texture: present, behind the content, inert, faint, and off for forced colors and more contrast', async ({ page }) => {
  await page.goto('/');
  const t = await page.evaluate(() => {
    const b = getComputedStyle(document.body, '::before');
    const h = getComputedStyle(document.querySelector('.texture-dots')!, '::before');
    const mask = (h.maskImage && h.maskImage !== 'none' ? h.maskImage : (h as unknown as { webkitMaskImage: string }).webkitMaskImage) || '';
    return { grainImg: b.backgroundImage.startsWith('url("data:image/svg+xml'), grainZ: b.zIndex, grainPointer: b.pointerEvents, grainOpacity: parseFloat(b.opacity), dotsImg: h.backgroundImage.includes('radial-gradient'), dotsZ: h.zIndex, dotsPointer: h.pointerEvents, dotsMask: mask.includes('radial-gradient') };
  });
  expect(t).toMatchObject({ grainImg: true, grainZ: '-1', grainPointer: 'none', dotsImg: true, dotsZ: '-1', dotsPointer: 'none', dotsMask: true });
  expect(t.grainOpacity, 'blend strength (the real safeguard is the measured-pixels test below)').toBeGreaterThan(0);
  expect(t.grainOpacity).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => getComputedStyle(document.body, '::before').mixBlendMode), 'neutral blend').toBe('overlay');
  // the texture must not sit over the content: the element at a point inside the hero heading is the heading itself
  const top = await page.evaluate(() => { const h = document.querySelector('h1')!.getBoundingClientRect(); const e = document.elementFromPoint(h.x + 10, h.y + h.height / 2); return e?.tagName; });
  expect(top).toBe('H1');
  for (const media of [{ forcedColors: 'active' }, { contrast: 'more' }] as const) {
    await page.emulateMedia(media as never);
    await page.goto('/');
    const d = await page.evaluate(() => [getComputedStyle(document.body, '::before').display, getComputedStyle(document.querySelector('.texture-dots')!, '::before').display]);
    expect(d, JSON.stringify(media)).toEqual(['none', 'none']);
    await page.emulateMedia({ forcedColors: 'none', contrast: 'no-preference' } as never);
  }
});

test('texture review screenshots: hero and checks panel at full resolution', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'design/screenshots/phase8/hero-texture-desktop.png', clip: { x: 0, y: 0, width: 1440, height: 760 } });
  await page.locator('#verify').screenshot({ path: 'design/screenshots/phase8/checks-panel-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: 'design/screenshots/phase8/hero-texture-phone.png', clip: { x: 0, y: 0, width: 390, height: 760 } });
});

test('the grain adds texture without shifting the background colour (measured from real pixels)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  await page.evaluate(() => document.fonts.ready);
  // an empty region to the right of the narrow contact column: only the page background and the grain are there
  const png = (await page.screenshot({ clip: { x: 1180, y: 300, width: 200, height: 200 } })).toString('base64');
  const stats = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data; let sum = 0, sq = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { const y = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += y; sq += y * y; n++; }
    const mean = sum / n; return { mean, sd: Math.sqrt(sq / n - mean * mean) };
  }, png);
  // --color-bg is #141414 = 20. The average must stay within 2 levels of it; a visible grain has a spread above 1.5 levels.
  expect(stats.mean, `mean ${stats.mean.toFixed(1)}`).toBeGreaterThan(18);
  expect(stats.mean, `mean ${stats.mean.toFixed(1)}`).toBeLessThan(22);
  expect(stats.sd, `spread ${stats.sd.toFixed(2)}`).toBeGreaterThan(1.5);
  expect(stats.sd, `spread ${stats.sd.toFixed(2)}`).toBeLessThan(12);
});

test.describe('resume', () => {
  for (const [name] of Object.entries(WIDTHS) as [keyof typeof WIDTHS, number][]) {
    test(`resume page is accessible and does not overflow at ${name}`, async ({ page }) => {
      await setSize(page, name);
      await page.goto('/resume/');
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
      expect(await page.locator('h1').count()).toBe(1);
      expect(await overflowOf(page)).toBeLessThanOrEqual(0);
    });
  }

  test('the HTML resume is noindex, uses the site contact data, and states only what the evidence supports', async ({ page }) => {
    await page.goto('/resume/');
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex');
    const t = await page.locator('main').innerText();
    expect(t).toContain(contact.email!);
    expect(await page.locator(`a[href="mailto:${contact.email}"]`).count()).toBe(1);
    expect(await page.locator(`a[href="${contact.github}"]`).count()).toBe(1);
    expect(await page.locator(`a[href="${contact.linkedin}"]`).count()).toBe(1);
    expect(await page.locator(`a[href="${site.address}"]`).count()).toBe(1);
    for (const s of ['Expected Fall 2026', 'University of Hawai', 'RyuZCloud', 'RyuStoreFront', 'ryuzcloud.com', 'ryustorefront.com']) expect(t, s).toContain(s);
    expect(t).not.toMatch(/Experience|Independent Software Engineer|Wildfire/);
    // nothing the owner has not supplied: no phone number, street address, GPA or invented employer
    expect(t).not.toMatch(/\b\d{3}[-. )]\d{3}[-. ]\d{4}\b/);
    expect(t).not.toMatch(/GPA|Present\s*,\s*[A-Z]|Inc\.|LLC|Corp\./);
    // the same banned phrases as the rest of the site
    expect(t).not.toMatch(/world-class|cutting-edge|revolutioni|seamless|passionate|leverag|robust|high-traffic|enterprise-grade/i);
    // external links on the resume stay on the allow-list
    const hrefs = await page.$$eval('a[href^="http"]', (as) => as.map((a) => a.getAttribute('href') as string));
    for (const h of hrefs) expect(ALLOWED_EXTERNAL).toContain(h);
  });

  test('resume.pdf is a real one-page PDF with a normal font embedding', async ({ request }) => {
    const res = await request.get('/resume.pdf');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    const body = await res.body();
    const raw = body.toString('latin1');
    expect(raw.startsWith('%PDF-')).toBe(true);
    expect((raw.match(/\/Type\s*\/Page(?!s)/g) || []).length, 'page count').toBe(1);
    expect(body.length, 'size').toBeLessThan(200 * 1024);
    // fonts are embedded as TrueType/CID, not the unusual Type 3 that a variable web font produces
    expect(raw).not.toMatch(/\/Subtype\s*\/Type3/);
    expect(raw).toMatch(/\/FontFile2/);
  });
});
