// Where did the CPU time go in a .cpuprofile? Prints self time by category, by file and by function.
// Production builds have no source maps, so files are bundle chunks and function names are minified, with their
// position in the bundle; source maps next to the chunks (or inline) are used when a build has them.
// Usage: node perf/analyze-profile.mjs <file> [top]  (TW_EXT: the build that was profiled, to find its maps)
import fs from 'fs';
import path from 'path';

import { SourceMapConsumer } from '../node_modules/source-map/source-map.js';

import { EXT } from './lib.mjs';

const file = process.argv[2];
const TOP = +(process.argv[3] ?? 25);
if (!file) {
  console.error('usage: node perf/analyze-profile.mjs <file.cpuprofile> [top]');
  process.exit(1);
}
const prof = JSON.parse(fs.readFileSync(file, 'utf8'));

const self = new Map();
for (let i = 0; i < prof.samples.length; i++)
  self.set(prof.samples[i], (self.get(prof.samples[i]) ?? 0) + (prof.timeDeltas[i] ?? 0));
const nodes = new Map(prof.nodes.map(n => [n.id, n]));
const total = [...self.values()].reduce((a, b) => a + b, 0) / 1000;

const consumers = new Map();
async function consumerFor(url) {
  if (consumers.has(url)) return consumers.get(url);
  let c = null;
  try {
    const rel = new URL(url).pathname;
    const mapPath = path.join(EXT, rel + '.map');
    if (fs.existsSync(mapPath)) c = await new SourceMapConsumer(JSON.parse(fs.readFileSync(mapPath, 'utf8')));
    else {
      const jsPath = path.join(EXT, rel);
      if (fs.existsSync(jsPath)) {
        const js = fs.readFileSync(jsPath, 'utf8');
        const i = js.lastIndexOf('sourceMappingURL=data:application/json');
        if (i !== -1)
          c = await new SourceMapConsumer(
            JSON.parse(Buffer.from(js.slice(js.indexOf('base64,', i) + 7).trim(), 'base64').toString('utf8'))
          );
      }
    }
  } catch (e) {
    console.error('map error', url, String(e).slice(0, 80));
  }
  consumers.set(url, c);
  return c;
}
const clean = s => (s ?? '').replace(/^webpack:\/\/[^/]*\//, '').replace(/^\.\//, '');
/** A source-mapped file groups by package or src folder; without maps, frames group by the kind of work. */
const category = (cf, mappedSrc) => {
  if (mappedSrc) {
    const m = mappedSrc.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
    if (m) return `node_modules/${m[1]}`;
    const s = mappedSrc.match(/^src\/([^/]+(?:\/[^/]+)?)/);
    return s ? `src/${s[1]}` : mappedSrc.split('/').slice(0, 2).join('/');
  }
  if (cf.url?.startsWith('chrome-extension')) return 'extension JavaScript';
  if (cf.functionName === '(program)') return 'browser work (style, layout, paint, …)';
  if (cf.functionName === '(garbage collector)') return 'garbage collection';
  if (cf.functionName === '(idle)') return 'idle';
  return cf.url ? 'other JavaScript' : `native ${cf.functionName || ''}`.trim();
};

const byFile = new Map(),
  byLine = new Map(),
  byCat = new Map();
let mappedFrames = 0;
for (const [id, us] of self) {
  const n = nodes.get(id);
  if (!n) continue;
  const cf = n.callFrame;
  const ms = us / 1000;
  let src = null,
    mapped = null,
    where = null,
    name = cf.functionName || '(anonymous)';
  if (cf.url && cf.url.startsWith('chrome-extension')) {
    const c = await consumerFor(cf.url);
    if (c) {
      const pos = c.originalPositionFor({ line: cf.lineNumber + 1, column: cf.columnNumber });
      if (pos.source) {
        mapped = clean(pos.source);
        where = `${mapped}:${pos.line}`;
        name = pos.name || name;
        mappedFrames++;
      }
    }
    src = mapped ?? path.basename(new URL(cf.url).pathname);
    where ??= `${src}:${cf.lineNumber + 1}:${cf.columnNumber + 1}`;
  }
  // Files and functions list JavaScript only; browser work, idle and garbage collection show up as categories.
  if (src) {
    byFile.set(src, (byFile.get(src) ?? 0) + ms);
    byLine.set(`${name}  ${where}`, (byLine.get(`${name}  ${where}`) ?? 0) + ms);
  }
  const cat = category(cf, mapped);
  byCat.set(cat, (byCat.get(cat) ?? 0) + ms);
}
const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const pct = v => `${((100 * v) / total).toFixed(1)}%`;
console.log(`# ${path.basename(file)}: ${total.toFixed(0)} ms of CPU time sampled`);
if (!mappedFrames)
  console.log('(production build: names are minified; open the .cpuprofile in Chrome DevTools for the call tree)');
const row = (v, label) => console.log(`  ${v.toFixed(0).padStart(6)} ms ${pct(v).padStart(6)}  ${label}`);
console.log('## by category');
const categories = top(byCat, Infinity);
for (const [k, v] of categories.filter(([, v]) => v >= total / 100)) row(v, k);
const small = categories.filter(([, v]) => v < total / 100);
if (small.length)
  row(
    small.reduce((sum, [, v]) => sum + v, 0),
    `other (${small.length} small items)`
  );
console.log(mappedFrames ? '## by source file' : '## by bundle file');
for (const [k, v] of top(byFile, TOP)) row(v, k);
console.log('## by function (position in the file)');
for (const [k, v] of top(byLine, TOP)) row(v, k);
