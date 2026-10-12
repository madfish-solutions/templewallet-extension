// Soak: keeps one extension page open for MINUTES and every STEP_MIN minutes walks Tokens → NFTs → Activity → Home by
// hash navigation (the page idles on Home in between, like a sidebar a user left open). Per page it records the time
// until the page is ready and the main-thread cost until then; per cycle memory after GC, DOM nodes, listeners,
// chrome.storage.local bytes, long tasks, requests and HTTP 429 answers since the last cycle, crashes and the lock
// state. One RESULT line per cycle, then a summary with first value, last value and least-squares slope per hour for
// every trend. Stops early, and says why, on a crash, a self-lock, or a page that never gets ready.
// Env: TAG, MINUTES (default 60), STEP_MIN (default 6; not 5, the LiFi refresh period), PAGE (sidebar, default, or
// fullpage), ACCOUNT (an account name to switch to first, e.g. "Account 1"), CONFIRM=1 (also open the send form and
// time the internal confirmation, then decline; signing accounts only), CONFIRM_TO (its recipient), SNAPSHOTS=1 (heap
// snapshots before the first cycle and at MINUTES−5 into perf/out/soak-<TAG>/; a snapshot slows later navigations
// about 2×, so compare snapshot runs only with snapshot runs), PROFILE_S (seconds of CPU profile recorded on Home
// after the last cycle, into the same folder), plus TW_EXT, TW_PROFILE_NAME, TW_PROFILE, RATE.
// The first walk after unlock is a warm-up and is not recorded; the cycle that stops the run is logged but left out of
// the trends.
import fs from 'fs';
import path from 'path';

import {
  launch,
  applyRate,
  TID,
  OUT_DIR,
  unlockIfNeeded,
  dismissModals,
  metrics,
  delta,
  memory,
  bytesInUse,
  readCrashes,
  readFocusLoss,
  walletLocked,
  accountName,
  crashSummary,
  result,
  RATE,
  screenText
} from './lib.mjs';

const TAG = process.env.TAG ?? 'soak';
const MINUTES = +(process.env.MINUTES ?? 60);
const STEP_MIN = +(process.env.STEP_MIN ?? 6);
const PAGE = process.env.PAGE ?? 'sidebar';
const ACCOUNT = process.env.ACCOUNT ?? null;
const CONFIRM = process.env.CONFIRM === '1';
const CONFIRM_TO = process.env.CONFIRM_TO ?? '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
const SNAPSHOTS = process.env.SNAPSHOTS === '1';
/** Seconds of CPU profile to record on Home after the last cycle (0 = none): what the page keeps doing by then. */
const PROFILE_S = +(process.env.PROFILE_S ?? 0);
const OUT = path.join(OUT_DIR, `soak-${TAG}`);
const READY_TIMEOUT_MS = 90_000 * RATE;
/** A user looks at a page for a moment before moving on. */
const DWELL_MS = 2000;
const log = (...a) => console.log(`[${TAG}]`, ...a);

const ASSET_ROW = TID('Assets/Asset Item Button');
// Activity items carry no test id on either build; this is the class list of their root element.
const ACTIVITY_ITEM = '.z-1.relative.group.rounded-lg';
/** Ready when every selector matches an element that did not exist before the navigation. */
const PAGES = [
  ['tokens', '#/tokens', [TID('Tokens/Search Field'), ASSET_ROW]],
  ['nfts', '#/nfts', [TID('Nfts Page/Collectible Item')]],
  ['activity', '#/activity', [ACTIVITY_ITEM]],
  ['home', '#/', [TID('Home/Tokens Section'), ASSET_ROW]]
];
const TRENDS = {
  'ready.tokens': c => c.ready.tokens,
  'ready.nfts': c => c.ready.nfts,
  'ready.activity': c => c.ready.activity,
  'ready.home': c => c.ready.home,
  'cost.home.TaskDuration': c => c.cost.home?.TaskDuration,
  heapMB: c => c.memory?.heapMB,
  listeners: c => c.memory?.listeners,
  nodes: c => c.memory?.nodes,
  storageBytes: c => c.storageBytes,
  'longTasks.totalMs': c => c.longTasks?.totalMs
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
/** A page whose main thread hangs never answers CDP or `evaluate`; resolve with `fallback` after `ms` instead. */
const guard = (promise, ms, fallback) => Promise.race([promise, sleep(ms).then(() => fallback)]);
/** Waits for `selector` without keeping an element handle (handles pin unmounted DOM for the whole run). */
const waitFor = (page, selector, timeout) => page.locator(selector).first().waitFor({ timeout });

/** Sets the hash and resolves with the ms until every selector matches a fresh element, or null on timeout. */
const navigateAndWait = (page, hash, selectors, timeoutMs) =>
  page.evaluate(
    ([hash, selectors, timeoutMs]) =>
      new Promise(resolve => {
        const before = new Set(selectors.flatMap(s => [...document.querySelectorAll(s)]));
        const fresh = s => [...document.querySelectorAll(s)].some(e => !before.has(e));
        const t0 = performance.now();
        location.hash = hash;
        const tick = () => {
          const t = performance.now() - t0;
          if (selectors.every(fresh)) return resolve(Math.round(t));
          if (t > timeoutMs) return resolve(null);
          setTimeout(tick, 16);
        };
        tick();
      }),
    [hash, selectors, timeoutMs]
  );

const installLongTaskObserver = page =>
  page.evaluate(() => {
    window.__soakLong = [];
    new PerformanceObserver(list => {
      window.__soakLong.push(...list.getEntries().map(e => Math.round(e.duration)));
    }).observe({ type: 'longtask' });
  });

const readLongTasks = page =>
  page
    .evaluate(() => window.__soakLong?.splice(0) ?? [])
    .then(d => ({ count: d.length, totalMs: d.reduce((a, b) => a + b, 0), maxMs: Math.max(0, ...d) }))
    .catch(() => null);

/** Streams a heap snapshot to `file`; chunks arrive before the command resolves. */
async function heapSnapshot(cdp, file) {
  const out = fs.createWriteStream(file);
  const onChunk = ({ chunk }) => out.write(chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  try {
    await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  } finally {
    cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
    await new Promise(r => out.end(r));
  }
}

async function selectAccount(page, name) {
  await page.click(TID('Home/Account Icon'));
  await waitFor(page, TID('Accounts Modal/Search Field'), 15000);
  await page.getByText(name, { exact: true }).first().click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  await dismissModals(page);
}

/** Send form → Send → internal confirmation; declined. `formMs` is hash → form, `confirmMs` is click → Confirm button. */
async function measureConfirm(page) {
  const timeout = READY_TIMEOUT_MS;
  try {
    const t0 = Date.now();
    await page.evaluate(() => void (location.hash = '#/send'));
    await waitFor(page, TID('Send Form/Amount Input'), timeout);
    const formMs = Date.now() - t0;
    await page.fill(TID('Send Form/Recipient Input'), CONFIRM_TO);
    await page.fill(TID('Send Form/Amount Input'), '0.0001');
    await page.waitForTimeout(1500);
    const t1 = Date.now();
    await page.click(TID('Send Form/Send Button'), { timeout: 10000 });
    // A form that does not reach its confirmation (no funds, validation) must not cost the whole ready timeout.
    await waitFor(page, TID('Internal Confirmation/Confirm Button'), 30_000 * RATE);
    const confirmMs = Date.now() - t1;
    await page.click(TID('Internal Confirmation/Decline Button'), { timeout: 10000 });
    await page.waitForTimeout(1000);
    return { formMs, confirmMs };
  } catch (e) {
    const failure = { error: String(e.message).split('\n')[0].slice(0, 100), screen: await screenText(page) };
    await dismissModals(page);
    return failure;
  }
}

/** Least-squares slope per hour over (minute, value) points, with the first and last value. */
const trend = points => {
  const pts = points.filter(([, y]) => typeof y === 'number');
  if (!pts.length) return null;
  const n = pts.length;
  const xs = pts.map(([m]) => m / 60);
  const ys = pts.map(([, y]) => y);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
  return { first: ys[0], last: ys[n - 1], perHour: sxx ? +(sxy / sxx).toFixed(1) : null, points: n };
};

const main = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { ctx, page, extId, startedAt } = await launch();
  const since = () => Math.round((Date.now() - startedAt) / 1000);
  let pageKind = PAGE;
  if (PAGE === 'sidebar') {
    await page.goto(`chrome-extension://${extId}/sidebar.html`);
    await applyRate(ctx, page);
    const rendered = await waitFor(page, `${TID('Unlock/Password Input')}, ${TID('Home/Account Icon')}`, 30000)
      .then(() => true)
      .catch(() => false);
    if (!rendered) {
      log(`sidebar.html did not render in a tab (page shows: ${await screenText(page)}); using fullpage.html`);
      pageKind = 'fullpage';
      await page.goto(`chrome-extension://${extId}/fullpage.html`);
      await applyRate(ctx, page);
    }
  }
  await waitFor(page, TID('Unlock/Password Input'), 60000).catch(() => {});
  await unlockIfNeeded(page);
  await waitFor(page, ASSET_ROW, READY_TIMEOUT_MS);
  await page.waitForTimeout(3000);
  await dismissModals(page);
  if (ACCOUNT) {
    await selectAccount(page, ACCOUNT);
    await waitFor(page, ASSET_ROW, READY_TIMEOUT_MS);
  }
  const account = await accountName(page);
  log(`page: ${pageKind}, account: ${account}, unlocked ${since()} s after launch`);

  let stop = null;
  page.on('crash', () => void (stop ??= { reason: 'renderer crash', at: 'page' }));
  page.on('close', () => void (stop ??= { reason: 'page closed', at: 'page' }));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable').catch(() => {});
  await installLongTaskObserver(page);
  let requests = 0;
  let throttled = 0;
  ctx.on('request', () => requests++);
  ctx.on('response', r => r.status() === 429 && throttled++);
  /** In-page wait, with a Node-side deadline for a main thread that never runs the poll. */
  const readyIn = (hash, selectors) =>
    guard(navigateAndWait(page, hash, selectors, READY_TIMEOUT_MS), READY_TIMEOUT_MS + 15_000, undefined);
  // The first walk after unlock runs on cold caches and would be the point with the most pull on every slope: take it
  // unrecorded, then start counting.
  for (const [, hash, selectors] of PAGES) await readyIn(hash, selectors);
  await readLongTasks(page);
  requests = throttled = 0;
  log(`warm-up walk done ${since()} s after launch`);

  const cycles = [];
  const t0 = Date.now();
  const minuteNow = () => +((Date.now() - t0) / 60000).toFixed(1);

  const cycle = async k => {
    const c = { probe: 'soak', tag: TAG, page: pageKind, account, cycle: k, minute: minuteNow(), ready: {}, cost: {} };
    // A wallet that locked itself or crashed while idle: say so instead of timing the unlock or error screen.
    const before = crashSummary(await guard(readCrashes(page), 10_000, []));
    if (await guard(walletLocked(page), 10_000, false)) stop ??= { reason: 'locked', at: 'idle' };
    else if (before.crashes) stop ??= { reason: 'crash', at: 'idle', crash: before.line };
    for (const [name, hash, selectors] of PAGES) {
      if (stop) break;
      const m0 = await guard(metrics(cdp), 10_000, {});
      c.ready[name] = await readyIn(hash, selectors);
      c.cost[name] = delta(m0, await guard(metrics(cdp), 10_000, {}));
      if (c.ready[name] == null) {
        const locked = await guard(walletLocked(page), 10_000, false);
        const crashes = await guard(readCrashes(page), 10_000, []);
        stop ??=
          c.ready[name] === undefined
            ? { reason: 'page unresponsive', at: name }
            : locked
              ? { reason: 'locked', at: name }
              : crashes.length
                ? { reason: 'crash', at: name, crash: crashSummary(crashes).line }
                : { reason: 'never ready', at: name, screen: await guard(screenText(page), 10_000, '(no answer)') };
        c.ready[name] = null;
        break;
      }
      await page.waitForTimeout(DWELL_MS);
    }
    if (!stop && CONFIRM) {
      c.confirm = await measureConfirm(page);
      await readyIn('#/', [TID('Home/Tokens Section')]);
    }
    c.memory = await guard(memory(cdp), 30_000, null);
    c.storageBytes = await guard(bytesInUse(page), 10_000, null);
    c.longTasks = await guard(readLongTasks(page), 10_000, null);
    c.requests = requests;
    c.throttled = throttled;
    requests = throttled = 0;
    const crash = crashSummary(await guard(readCrashes(page), 10_000, []));
    Object.assign(c, { crashes: crash.crashes, crash: crash.crash });
    c.locked = await guard(walletLocked(page), 10_000, false);
    c.focusLoss = (await guard(readFocusLoss(page), 10_000, [])).length;
    if (crash.crashes) stop ??= { reason: 'crash', at: 'idle', crash: crash.line };
    if (c.locked) stop ??= { reason: 'locked', at: 'idle' };
    c.stop = stop;
    cycles.push(c);
    result(c);
    log(
      `cycle ${k} @ ${c.minute} min: ready ${JSON.stringify(c.ready)} heap ${c.memory?.heapMB} MB listeners ${c.memory?.listeners} nodes ${c.memory?.nodes} storage ${c.storageBytes} long ${c.longTasks?.count}/${c.longTasks?.totalMs} ms 429s ${c.throttled}${stop ? ` STOP: ${JSON.stringify(stop)}` : ''}`
    );
  };

  // The first snapshot goes before the first cycle: a snapshot slows the page's later navigations about 2×, so every
  // cycle must be measured after one for the cycles to compare with each other (not with snapshot-free runs).
  const events = [];
  for (let m = 0; m <= MINUTES; m += STEP_MIN) events.push({ minute: m, kind: 'cycle' });
  if (SNAPSHOTS)
    for (const m of new Set([0, MINUTES - 5])) if (m >= 0 && m < MINUTES) events.push({ minute: m, kind: 'snapshot' });
  events.sort((a, b) => a.minute - b.minute || (a.kind === 'snapshot' ? -1 : 1));

  let k = 0;
  try {
    for (const event of events) {
      if (stop) break;
      const due = t0 + event.minute * 60_000;
      while (Date.now() < due && !stop) await sleep(Math.min(5000, due - Date.now()));
      if (stop) break;
      if (event.kind === 'cycle') await cycle(k++);
      else {
        const file = path.join(OUT, `heap-${event.minute}min.heapsnapshot`);
        const t = Date.now();
        await guard(heapSnapshot(cdp, file), 300_000, null);
        log(
          `heap snapshot at ${event.minute} min → ${file} (${Math.round(fs.statSync(file).size / 1048576)} MB, ${Date.now() - t} ms)`
        );
      }
    }
    if (PROFILE_S > 0 && !stop) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
      await cdp.send('Profiler.start');
      await page.waitForTimeout(PROFILE_S * 1000);
      const { profile } = await cdp.send('Profiler.stop');
      const file = path.join(OUT, 'end.cpuprofile');
      fs.writeFileSync(file, JSON.stringify(profile));
      log(`CPU profile of ${PROFILE_S} s after the last cycle → ${file} (node perf/analyze-profile.mjs ${file})`);
    }
  } finally {
    // The cycle that stopped the run measured an unlock or error screen: it stays in the log, not in the trends.
    const measured = cycles.filter(c => !c.stop);
    const trends = Object.fromEntries(
      Object.entries(TRENDS).map(([key, pick]) => [key, trend(measured.map(c => [c.minute, pick(c)]))])
    );
    log(`summary after ${cycles.length} cycles${stop ? `, stopped early: ${JSON.stringify(stop)}` : ''}`);
    for (const [key, t] of Object.entries(trends))
      if (t)
        log(
          `  ${key.padEnd(24)} first ${String(t.first).padStart(9)}  last ${String(t.last).padStart(9)}  per hour ${t.perHour ?? 'n/a'}`
        );
    result({
      probe: 'soak-summary',
      tag: TAG,
      page: pageKind,
      account,
      rate: RATE,
      snapshots: SNAPSHOTS,
      cycles: cycles.length,
      minutes: cycles.at(-1)?.minute ?? 0,
      stop,
      trends
    });
  }
  await guard(ctx.close(), 60_000, null);
};
main().catch(e => {
  console.error(`[${TAG}] FAILED`, e);
  process.exit(1);
});
