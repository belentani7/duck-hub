import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROUTES = ['/', '/hub/', '/catalog/', '/ferramentas/'];
const PAGES = ['index.html', 'hub/index.html', 'catalog/index.html', 'ferramentas/index.html'];
const BASE = '/duck-hub/';

function attributes(html, tag, attribute) {
  const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, 'gi')) ?? [];
  const attr = new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  return tags.map((element) => element.match(attr)?.[2]).filter((value) => value !== undefined);
}

function localPath(url, base, output, label) {
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  assert.ok(url.startsWith(base), `${label}: URL escapes project base: ${url}`);
  const pathname = url.split(/[?#]/, 1)[0];
  let decoded;
  try { decoded = decodeURIComponent(pathname.slice(base.length)); }
  catch { assert.fail(`${label}: malformed URL encoding: ${url}`); }
  assert.ok(!decoded.split('/').some((segment) => segment === '..' || segment === '.'), `${label}: unsafe path: ${url}`);
  const candidate = resolve(output, decoded);
  assert.ok(candidate === output || candidate.startsWith(output + sep), `${label}: path escapes output: ${url}`);
  return candidate;
}

/** Verify the actual emitted Pages HTML, not merely strings in its source. */
export function verifyPages(output = resolve('dist/public'), base = BASE) {
  assert.ok(base.startsWith('/') && base.endsWith('/'), 'Project base must be absolute and end with /');
  for (const path of [...PAGES, 'duck-signal.svg']) {
    assert.ok(existsSync(resolve(output, path)), `Missing Astro release file: ${path}`);
  }

  const homeLinks = new Set(attributes(readFileSync(resolve(output, PAGES[0]), 'utf8'), 'a', 'href'));
  for (const route of ROUTES) {
    assert.ok(homeLinks.has(base + route.slice(1)), `Homepage missing actual scoped anchor: ${base + route.slice(1)}`);
  }

  for (const page of PAGES) {
    const html = readFileSync(resolve(output, page), 'utf8');
    assert.match(html, /<main\b/i, `${page}: missing main landmark`);
    assert.match(html, /<title>[^<\s][^<]*<\/title>/i, `${page}: missing non-empty SEO title`);
    const anchors = attributes(html, 'a', 'href');
    const resources = [
      ...attributes(html, 'img', 'src'),
      ...attributes(html, 'script', 'src'),
      ...attributes(html, 'link', 'href'),
    ];
    for (const href of [...anchors, ...resources]) {
      assert.ok(!href.startsWith('/manus-storage/'), `${page}: private archive URL exposed: ${href}`);
      const candidate = localPath(href, base, output, page);
      if (!candidate) continue;
      const target = href.split(/[?#]/, 1)[0];
      const expected = target.endsWith('/') ? resolve(candidate, 'index.html') : candidate;
      assert.ok(existsSync(expected), `${page}: broken local link or asset: ${href}`);
    }
  }
  return { routes: PAGES.length, base };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifyPages();
  console.log(`Duck Hub Pages: ${result.routes} built routes, scoped anchors and local assets OK.`);
}
