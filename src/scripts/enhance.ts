// The site's only client script (one file, one request). Everything works without it; it adds:
//  1. Escape and outside-click to close the mobile menu, returning focus to the button.
//  2. A pointer spotlight on project cards, on hover-capable devices only.
// Kept external (never inline) so the Content-Security-Policy can be `script-src 'self'`.

const menu = document.querySelector<HTMLDetailsElement>('[data-menu]');
if (menu) {
  const summary = menu.querySelector('summary');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) { menu.open = false; summary?.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  });
}

if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener('pointermove', (e) => {
    const card = (e.target as Element | null)?.closest<HTMLElement>('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}
