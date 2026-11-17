// Unit tests for the CloudFront viewer-request function (infra/terraform/rewrite.js).
// The file is plain ES5 as CloudFront requires, so it is loaded as text and evaluated.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const code = readFileSync('infra/terraform/rewrite.js', 'utf8');
const handler = new Function(`${code}; return handler;`)();
const call = (uri, querystring = {}) => handler({ request: { uri, querystring, headers: {} } });

test('the root and directory URLs map to index.html', () => {
  assert.equal(call('/').uri, '/index.html');
  assert.equal(call('/projects/').uri, '/projects/index.html');
  assert.equal(call('/projects/ryucloud/').uri, '/projects/ryucloud/index.html');
});

test('extension-less paths redirect (301) to the trailing-slash form', () => {
  const r = call('/projects/ryucloud');
  assert.equal(r.statusCode, 301);
  assert.equal(r.headers.location.value, '/projects/ryucloud/');
  assert.equal(call('/about').headers.location.value, '/about/');
});

test('a redirect keeps the query string', () => {
  const r = call('/about', { a: { value: '1' }, b: { value: '2' } });
  assert.equal(r.headers.location.value, '/about/?a=1&b=2');
});

test('files with an extension pass through unchanged', () => {
  for (const u of ['/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/_astro/Base.abc123.css', '/fonts/HankenGrotesk-wght.woff2', '/404.html', '/index.html']) {
    const r = call(u);
    assert.equal(r.uri, u, u);
    assert.equal(r.statusCode, undefined, u);
  }
});

test('a dot in a directory name does not count as an extension', () => {
  assert.equal(call('/a.b/c').statusCode, 301);
  assert.equal(call('/a.b/c/').uri, '/a.b/c/index.html');
});

test('every page the build produces is reachable through the function', () => {
  // Walk dist/: every index.html must be addressable by its directory URL, and the function must map that URL back to the file.
  const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const pages = walk('dist').filter((p) => p.endsWith('/index.html') || p === 'dist/index.html');
  assert.ok(pages.length >= 8, `found ${pages.length} pages`);
  for (const file of pages) {
    const url = '/' + file.replace(/^dist\//, '').replace(/index\.html$/, '');
    assert.equal(call(url).uri, url + 'index.html', url);
    assert.ok(statSync('dist' + call(url).uri).isFile(), `dist${call(url).uri} exists`);
  }
});

test('internal links in the built HTML all resolve to a file or a function-mapped page', () => {
  const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const htmls = walk('dist').filter((p) => p.endsWith('.html'));
  const missing = [];
  for (const f of htmls) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const u = m[1];
      const mapped = call(u);
      if (mapped.statusCode) { missing.push(`${f}: ${u} would redirect`); continue; }
      try { statSync('dist' + mapped.uri); } catch { missing.push(`${f}: ${u} -> ${mapped.uri} not in dist`); }
    }
  }
  assert.deepEqual(missing, []);
});
