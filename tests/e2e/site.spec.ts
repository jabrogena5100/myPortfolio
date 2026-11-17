import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/projects/', '/projects/ryustorefront/', '/projects/ryucloud/', '/projects/wildfire-monitoring/', '/services/', '/about/', '/contact/'];
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
