import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROUTES = ['/', '/hub/', '/catalog/', '/ferramentas/'];
const PAGES = ['index.html', 'hub/index.html', 'catalog/index.html', 'ferramentas/index.html'];
const BASE = '/duck-hub/';

function* startTags(html) {
  let position = 0;
  while ((position = html.indexOf('<', position)) !== -1) {
    if (html.startsWith('<!--', position)) {
      const end = html.indexOf('-->', position + 4);
      position = end === -1 ? html.length : end + 3;
      continue;
    }
    const opening = /^<([a-z][\w:-]*)\b/i.exec(html.slice(position));
    if (!opening) { position++; continue; }
    const name = opening[1].toLowerCase();
    let end = position + opening[0].length;
    let quote = null;
    for (; end < html.length; end++) {
      const char = html[end];
      if (quote) { if (char === quote) quote = null; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
    }
    if (end === html.length) break;
    const attrs = new Map();
    const raw = html.slice(position + opening[0].length, end);
    const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (const match of raw.matchAll(pattern)) {
      attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
    }
    yield { name, attrs, contentStart: end + 1 };
    position = end + 1;
    if (['script', 'style', 'template', 'textarea', 'title'].includes(name)) {
      const close = new RegExp(`</${name}\\s*>`, 'gi');
      close.lastIndex = position;
      const match = close.exec(html);
      position = match ? close.lastIndex : html.length;
    }
  }
}

function attributes(html, tag, attribute) {
  const values = [];
  for (const item of startTags(html)) {
    if (item.name === tag && item.attrs.has(attribute)) values.push(item.attrs.get(attribute));
  }
  return values;
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
    const tags = [...startTags(html)];
    assert.ok(tags.some((tag) => tag.name === 'main'), `${page}: missing main landmark`);
    assert.ok(tags.some((tag) => tag.name === 'title' &&
      /^([^<]*\S[^<]*)<\/title\s*>/i.test(html.slice(tag.contentStart))),
      `${page}: missing non-empty SEO title`);
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
