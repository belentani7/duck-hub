import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const out=resolve('dist/public');
const required=['index.html','hub/index.html','catalog/index.html',
  'ferramentas/index.html','duck-signal.svg'];
for (const path of required) {
  assert.ok(existsSync(resolve(out,path)), 'Missing Astro release file: '+path);
}
const index=readFileSync(resolve(out,'index.html'),'utf8');
for(const path of ['/duck-hub/','/duck-hub/hub/','/duck-hub/catalog/','/duck-hub/ferramentas/']) {
  assert.ok(index.includes(path),'Homepage missing scoped link: '+path);
}
const all=required.filter(x=>x.endsWith('index.html'));
for(const p of all){
  const html=readFileSync(resolve(out,p),'utf8');
  assert.doesNotMatch(html, /(?:src|href)="\/manus-storage\//, 'Missing archive asset exposed by '+p);
  assert.match(html, /<main\b/, 'Missing main region: '+p);
  assert.match(html, /<title>/, 'Missing SEO title: '+p);
}
console.log('Duck Hub project Pages release: 4 routes, scoped links and local art OK.');
