import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { verifyPages } from './verify-pages.mjs';

const BASE = '/duck-hub/';
const routes = ['/', '/hub/', '/catalog/', '/ferramentas/'];
const paths = ['index.html', 'hub/index.html', 'catalog/index.html', 'ferramentas/index.html'];

function fixture(edit = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'duck-pages-'));
  const files = new Map(paths.map((path, index) => [path,
    `<html><head><title>Duck ${index}</title><link rel="stylesheet" href="${BASE}_astro/site.css"></head><body><main><img src="${BASE}duck-signal.svg" alt="Duck" />${routes.map((route) => `<a href="${BASE}${route.slice(1)}">${route}</a>`).join('')}</main></body></html>`]));
  edit(files);
  for (const [path, html] of files) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), html);
  }
  mkdirSync(join(root, '_astro'), { recursive: true });
  writeFileSync(join(root, '_astro/site.css'), 'body{}');
  writeFileSync(join(root, 'duck-signal.svg'), '<svg/>');
  return root;
}

function withFixture(edit, fn) {
  const root = fixture(edit);
  try { fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

test('accepts a built site with real scoped navigation and assets', () => {
  withFixture(() => {}, (root) => assert.deepEqual(verifyPages(root), { routes: 4, base: BASE }));
});

test('rejects missing actual anchors even when route strings exist in script', () => {
  withFixture((files) => files.set('index.html', files.get('index.html').replace('<a href="/duck-hub/catalog/">/catalog/</a>', '<script>const catalog="/duck-hub/catalog/"</script>')),
    (root) => assert.throws(() => verifyPages(root), /missing actual scoped anchor/));
});

test('rejects root-relative links escaping the project Pages base on any page', () => {
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html').replace('/duck-hub/catalog/', '/catalog/')),
    (root) => assert.throws(() => verifyPages(root), /escapes project base/));
});

test('rejects missing local image and stylesheet assets', () => {
  withFixture((files) => files.set('catalog/index.html', files.get('catalog/index.html').replace('duck-signal.svg', 'missing.svg')),
    (root) => assert.throws(() => verifyPages(root), /broken local link or asset/));
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html').replace('_astro/site.css', '_astro/missing.css')),
    (root) => assert.throws(() => verifyPages(root), /broken local link or asset/));
});

test('rejects links to missing generated routes', () => {
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html') + '<a href="/duck-hub/not-built/">broken</a>'),
    (root) => assert.throws(() => verifyPages(root), /broken local link or asset/));
});

test('rejects private archived media and encoded path traversal', () => {
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html') + '<img src="/manus-storage/private.png">'),
    (root) => assert.throws(() => verifyPages(root), /private archive URL exposed/));
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html') + '<a href="/duck-hub/%2e%2e/secrets">bad</a>'),
    (root) => assert.throws(() => verifyPages(root), /unsafe path/));
});

test('rejects pages without semantic main and a real title', () => {
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html').replace('<main>', '<div>').replace('</main>', '</div>')),
    (root) => assert.throws(() => verifyPages(root), /missing main landmark/));
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html').replace('<title>Duck 1</title>', '<title> </title>')),
    (root) => assert.throws(() => verifyPages(root), /missing non-empty SEO title/));
});

test('rejects fake navigation in comments, script strings, template and data attributes', () => {
  const real = '<a href="/duck-hub/catalog/">/catalog/</a>';
  const fake = [
    '<!-- <a href="/duck-hub/catalog/">fake</a> -->',
    '<script>const fake = `<a href="/duck-hub/catalog/">fake</a>`</script>',
    '<template><a href="/duck-hub/catalog/">fake</a></template>',
    '<div data-markup="<a href=\'/duck-hub/catalog/\'>">fake</div>',
    '<a data-href="/duck-hub/catalog/">fake</a>',
  ];
  for (const replacement of fake) {
    withFixture((files) => files.set('index.html', files.get('index.html').replace(real, replacement)),
      (root) => assert.throws(() => verifyPages(root), /missing actual scoped anchor/, replacement));
  }
});

test('rejects missing assets disguised as commented or scripted markup', () => {
  for (const fake of [
    '<!-- <img src="/duck-hub/missing.svg"> -->',
    '<script>const sample = `<img src="/duck-hub/missing.svg">`</script>',
  ]) {
    withFixture((files) => files.set('hub/index.html', files.get('hub/index.html') + fake),
      (root) => assert.deepEqual(verifyPages(root), { routes: 4, base: BASE }));
  }
});

test('recognizes valid mixed-case and unquoted href attributes', () => {
  withFixture((files) => files.set('index.html', files.get('index.html').replace('<a href="/duck-hub/catalog/">', '<A HREF=/duck-hub/catalog/>')),
    (root) => assert.deepEqual(verifyPages(root), { routes: 4, base: BASE }));
});

test('rejects commented-out or scripted main and title placeholders', () => {
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html')
    .replace('<main>', '<div><!-- <main> -->').replace('</main>', '</div>')),
    (root) => assert.throws(() => verifyPages(root), /missing main landmark/));
  withFixture((files) => files.set('hub/index.html', files.get('hub/index.html')
    .replace('<title>Duck 1</title>', '<!-- <title>Duck 1</title> -->')),
    (root) => assert.throws(() => verifyPages(root), /missing non-empty SEO title/));
});
