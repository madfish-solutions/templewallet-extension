// One report from a DevTools-format trace (Chrome "Save profile…" or perf/jank.mjs). Streams the file twice rather
// than JSON.parse-ing it whole, but retains per-sample, per-frame and per-node arrays (hence --max-old-space-size).
// Prints only aggregates, then one `RESULT {…}` line for perf/compare.mjs. Names of JS frames are minified and differ
// per build: compare the structural lines across builds, not the names. Expects one JSON event per line.
// Usage: node --max-old-space-size=8192 perf/trace/report.mjs <trace.json>
import fs from 'node:fs';
import readline from 'node:readline';

const FILE = process.argv[2];
if (!FILE) {
  console.error('usage: node perf/trace/report.mjs <trace.json>');
  process.exit(2);
}

const stream = () =>
  readline.createInterface({
    input: fs.createReadStream(FILE, { encoding: 'utf8', highWaterMark: 1 << 22 }),
    crlfDelay: Infinity
  });
const parse = raw => {
  let l = raw.trim();
  if (!l.startsWith('{')) return null;
  if (l.endsWith(',')) l = l.slice(0, -1);
  try {
    return JSON.parse(l);
  } catch {
    return null;
  }
};
const sec = us => `${(us / 1e6).toFixed(2)}s`;
const short = url => (url || '(native)').replace(/^chrome-extension:\/\/[a-z]+\//, '');
const idOf = e => e.id ?? e.id2?.local ?? e.id2?.global;

// ---------- pass A: thread names, RunTask windows, profile ids ----------
const threadNames = new Map();
const runTaskByThread = new Map();
const tasksByThread = new Map();
const profiles = new Map();
for await (const raw of stream()) {
  if (!raw.includes('"RunTask"') && !raw.includes('thread_name') && !raw.includes('"Profile"')) continue;
  const e = parse(raw);
  if (!e) continue;
  const key = `${e.pid}:${e.tid}`;
  if (e.name === 'thread_name' && e.args?.name) threadNames.set(key, e.args.name);
  else if (e.name === 'Profile' && e.args?.data?.startTime)
    profiles.set(idOf(e), { pid: e.pid, tid: e.tid, startTime: e.args.data.startTime });
  else if (e.name === 'RunTask' && Number.isFinite(e.dur)) {
    const a = runTaskByThread.get(key) || { n: 0, dur: 0 };
    a.n++;
    a.dur += e.dur;
    runTaskByThread.set(key, a);
    if (e.dur >= 16000) {
      if (!tasksByThread.has(key)) tasksByThread.set(key, []);
      tasksByThread.get(key).push({ ts: e.ts, end: e.ts + e.dur, dur: e.dur });
    }
  }
}
if (!threadNames.size && !runTaskByThread.size) {
  console.error(
    'unrecognised trace layout: expected one JSON event per line (DevTools "Save profile…" or perf/jank.mjs output)'
  );
  process.exit(1);
}
let main = null;
for (const [key, a] of runTaskByThread)
  if (threadNames.get(key) === 'CrRendererMain' && (!main || a.dur > main.dur)) main = { key, ...a };
if (!main) {
  console.error('no CrRendererMain thread with RunTask events (is "toplevel" in the trace categories?)');
  process.exit(1);
}
const [MPID, MTID] = main.key.split(':').map(Number);
const win16 = (tasksByThread.get(main.key) || []).sort((a, b) => a.ts - b.ts);
const win50 = win16.filter(w => w.dur >= 50000);
const profId = [...profiles.entries()].find(([, p]) => p.pid === MPID && p.tid === MTID)?.[0] ?? null;
const swRunUs = [...runTaskByThread.entries()]
  .filter(([k]) => threadNames.get(k) === 'ServiceWorker thread')
  .reduce((a, [, v]) => a + v.dur, 0);

const overlaps = (arr, b, en) => {
  let lo = 0,
    hi = arr.length - 1,
    first = arr.length;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (arr[m].end > b) {
      first = m;
      hi = m - 1;
    } else lo = m + 1;
  }
  for (let i = Math.max(0, first - 3); i < arr.length && arr[i].ts < en; i++)
    if (arr[i].end > b && arr[i].ts < en) return true;
  return false;
};
const longTaskAt = ts => {
  let lo = 0,
    hi = win50.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (win50[m].end < ts) lo = m + 1;
    else if (win50[m].ts > ts) hi = m - 1;
    else return win50[m];
  }
  return null;
};

// ---------- pass B: samples, frames, animations, event durations ----------
const nodes = new Map();
let sampleTs = profId ? profiles.get(profId).startTime : 0;
const samples = []; // flat triples: node id, absolute ts, delta
const openFrames = new Map();
const frames = [];
const animByNode = new Map(); // nodeName -> { running, failed: Map(code -> n) }
const animNodeById = new Map();
const failedBeforeNode = new Map();
const evByName = new Map();
for await (const raw of stream()) {
  const e = parse(raw);
  if (!e) continue;
  if (e.name === 'ProfileChunk' && idOf(e) === profId) {
    const d = e.args?.data;
    const cp = d?.cpuProfile;
    if (cp && Array.isArray(cp.nodes)) for (const n of cp.nodes) nodes.set(n.id, n);
    const sm = cp && Array.isArray(cp.samples) ? cp.samples : null;
    const dt = Array.isArray(d?.timeDeltas) ? d.timeDeltas : null; // sibling of cpuProfile, not inside it
    if (sm && dt) {
      if (sm.length !== dt.length)
        console.error(
          `ProfileChunk samples/timeDeltas length mismatch (${sm.length} vs ${dt.length}); later timestamps drift`
        );
      for (let i = 0; i < Math.min(sm.length, dt.length); i++) {
        sampleTs += dt[i];
        samples.push(sm[i], sampleTs, dt[i]);
      }
    }
    continue;
  }
  if (e.name === 'PipelineReporter' && e.pid === MPID) {
    const key = idOf(e);
    if (e.ph === 'b') {
      const r = e.args?.frame_reporter || e.args?.chrome_frame_reporter || {};
      openFrames.set(key, {
        ts: e.ts,
        state: r.state,
        smooth: r.affects_smoothness,
        lth: r.layer_tree_host_id,
        mainAnim: r.has_main_animation
      });
    } else if (e.ph === 'e') {
      const b = openFrames.get(key);
      if (b) {
        openFrames.delete(key);
        b.end = e.ts;
        frames.push(b);
      }
    }
    continue;
  }
  if (e.name === 'Animation' && e.pid === MPID) {
    const d = e.args?.data || {};
    const id = idOf(e);
    if (d.nodeName) {
      animNodeById.set(id, d.nodeName);
      const a = animByNode.get(d.nodeName) || { running: 0, failed: new Map() };
      if (d.state === 'running') a.running++;
      animByNode.set(d.nodeName, a);
      const early = failedBeforeNode.get(id);
      if (early !== undefined) {
        a.failed.set(early, (a.failed.get(early) || 0) + 1);
        failedBeforeNode.delete(id);
      }
    }
    if (d.compositeFailed !== undefined) {
      const node = animNodeById.get(id);
      if (node) {
        const a = animByNode.get(node);
        a.failed.set(d.compositeFailed, (a.failed.get(d.compositeFailed) || 0) + 1);
      } else failedBeforeNode.set(id, d.compositeFailed);
    }
    continue;
  }
  if (e.pid !== MPID || e.tid !== MTID) continue;
  if (Number.isFinite(e.dur)) {
    const a = evByName.get(e.name) || { n: 0, dur: 0 };
    a.n++;
    a.dur += e.dur;
    evByName.set(e.name, a);
  }
}

// ---------- report ----------
const label = id => {
  const cf = (nodes.get(id) || {}).callFrame || {};
  return `${cf.functionName || '(anonymous)'}@${short(cf.url)}:${cf.lineNumber}:${cf.columnNumber}`;
};
console.log(`# trace ${FILE}`);
console.log(
  `main thread ${main.key}: RunTask ${sec(main.dur)} over ${main.n} tasks | service worker RunTask ${sec(swRunUs)} | profile ${profId ?? 'NONE'} samples=${samples.length / 3}`
);

console.log('\n## long tasks (main thread)');
for (const [name, lo, hi] of [
  ['50-100ms', 50000, 100000],
  ['100-200ms', 100000, 200000],
  ['200-500ms', 200000, 500000],
  ['>=500ms', 500000, Infinity]
]) {
  const ws = win50.filter(w => w.dur >= lo && w.dur < hi);
  console.log(`  ${name.padEnd(10)} n=${String(ws.length).padStart(4)}  ${sec(ws.reduce((a, w) => a + w.dur, 0))}`);
}
console.log(
  `  TOTAL >=50ms n=${win50.length} ${sec(win50.reduce((a, w) => a + w.dur, 0))} ; >=100ms n=${win50.filter(w => w.dur >= 100000).length}`
);

const inLongByScript = new Map();
const inLongByFrame = new Map();
const selfByScript = new Map();
for (let i = 0; i < samples.length; i += 3) {
  const id = samples[i];
  const dt = samples[i + 2];
  const cf = (nodes.get(id) || {}).callFrame || {};
  const fn = cf.functionName || '';
  const script = fn.startsWith('(') ? fn : cf.url ? short(cf.url) : '(native builtin)';
  selfByScript.set(script, (selfByScript.get(script) || 0) + dt);
  if (!longTaskAt(samples[i + 1])) continue;
  inLongByScript.set(script, (inLongByScript.get(script) || 0) + dt);
  inLongByFrame.set(label(id), (inLongByFrame.get(label(id)) || 0) + dt);
}
const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
console.log('\n## self time inside long tasks, by script');
for (const [k, v] of top(inLongByScript, 12)) console.log(`  ${sec(v).padStart(8)}  ${k}`);
console.log('\n## top frames inside long tasks (minified; compare shapes across builds, not names)');
for (const [k, v] of top(inLongByFrame, 15)) console.log(`  ${sec(v).padStart(8)}  ${k}`);
console.log('\n## self time by script (whole profile)');
for (const [k, v] of top(selfByScript, 10)) console.log(`  ${sec(v).padStart(8)}  ${k}`);

console.log('\n## frames (renderer, per layer tree host)');
const frameStats = [];
for (const lth of [...new Set(frames.map(f => f.lth))]) {
  const fr = frames.filter(f => f.lth === lth);
  const dropped = fr.filter(f => f.state === 'STATE_DROPPED' && f.smooth !== false);
  const partial = fr.filter(f => f.state === 'STATE_PRESENTED_PARTIAL' && f.smooth !== false);
  const mainAnim = fr.filter(f => f.mainAnim).length;
  let d16 = 0,
    d50 = 0;
  for (const f of dropped) {
    if (overlaps(win16, f.ts, f.end)) d16++;
    if (overlaps(win50, f.ts, f.end)) d50++;
  }
  const ts = fr.map(f => f.ts).sort((a, b) => a - b);
  const gaps = ts
    .slice(1)
    .map((v, i) => v - ts[i])
    .filter(g => g > 1000 && g < 100000)
    .sort((a, b) => a - b);
  const median = gaps[gaps.length >> 1] || 0;
  const pct = n => `${((100 * n) / Math.max(1, fr.length)).toFixed(0)}%`;
  frameStats.push({ total: fr.length, dropped: dropped.length, partial: partial.length });
  console.log(
    `  lth=${lth}: frames=${fr.length} dropped=${dropped.length} (${pct(dropped.length)}) partial=${partial.length} main_animation=${mainAnim} (${pct(mainAnim)}) | dropped overlapping task>=16ms ${d16}, >=50ms ${d50} | median interval ${(median / 1e3).toFixed(2)}ms`
  );
}

console.log('\n## animations (main-thread Animation events; compositeFailed codes per node)');
const animRows = [...animByNode.entries()].sort((a, b) => b[1].running - a[1].running);
if (!animRows.length) console.log('  NO_ANIMATION_EVENTS (is "blink.animations" in the trace categories?)');
for (const [node, a] of animRows.slice(0, 8))
  console.log(
    `  running=${String(a.running).padStart(5)} compositeFailed=${JSON.stringify(Object.fromEntries(a.failed))}  ${node.slice(0, 110)}`
  );
// compositeFailed 0 is Blink's kNoFailure: the animation DID composite. Only non-zero codes are failures.
const failureCount = a => [...a.failed.entries()].reduce((x, [code, n]) => x + (Number(code) === 0 ? 0 : n), 0);
const spinner = animRows.filter(([n]) => n.includes('animate-spin'));
console.log(
  spinner.length
    ? `  SPINNER: ${spinner.map(([n, a]) => `${n.split(' ')[0]} running=${a.running} failed=${failureCount(a)}`).join('; ')}`
    : '  NO_SPINNER_OBSERVED'
);

console.log('\n## main-thread events by total duration (top 12)');
for (const [k, a] of [...evByName.entries()].sort((a, b) => b[1].dur - a[1].dur).slice(0, 12))
  console.log(`  ${sec(a.dur).padStart(8)} n=${String(a.n).padStart(7)}  ${k}`);

const sumMs = ws => Math.round(ws.reduce((a, w) => a + w.dur, 0) / 1000);
const long500 = win50.filter(w => w.dur >= 500000);
console.log(
  `RESULT ${JSON.stringify({
    probe: 'trace',
    busyMs: Math.round(main.dur / 1000),
    swBusyMs: Math.round(swRunUs / 1000),
    long50: { n: win50.length, ms: sumMs(win50) },
    long100: win50.filter(w => w.dur >= 100000).length,
    long500: { n: long500.length, ms: sumMs(long500) },
    // The main page is the layer tree host with the most frames.
    frames: frameStats.sort((a, b) => b.total - a.total)[0] ?? null,
    spinnerNotComposited: spinner.length ? spinner.reduce((n, [, a]) => n + failureCount(a), 0) : null
  })}`
);
