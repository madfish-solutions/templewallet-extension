// Moment 1: service-worker-cold open → unlock screen, then unlock click → balances painted, with main-thread cost
// and which API responses completed before the first row. Env: TAG, OFFLINE=1 (all DNS blocked), WINDOW_MS.
import {
  launch,
  TID,
  PASSWORD,
  stopServiceWorkers,
  navTiming,
  bytesInUse,
  pollState,
  metrics,
  delta,
  readCrashes,
  missingSelectors,
  crashSummary,
  result,
  RATE,
  applyRate
} from './lib.mjs';

const TAG = process.env.TAG ?? 'unlock';
const OFFLINE = process.env.OFFLINE === '1';
// A throttled CPU (RATE) stretches every milestone, so the default window stretches with it.
const WINDOW_MS = +(process.env.WINDOW_MS ?? 20000 * Math.max(1, RATE));
const log = (...a) => console.log(`[${TAG}]`, ...a);

const main = async () => {
  const { ctx, page, extId } = await launch({ extraArgs: OFFLINE ? ['--host-resolver-rules=MAP * ~NOTFOUND'] : [] });
  await page.waitForSelector(TID('Unlock/Password Input'), { timeout: 60000 });

  const swStopped = await stopServiceWorkers(ctx, page);
  await page.waitForTimeout(1000);
  const tNav = Date.now();
  await page.goto(`chrome-extension://${extId}/fullpage.html`, { waitUntil: 'commit' });
  await applyRate(ctx, page);
  let unlockScreenAt = null;
  while (Date.now() - tNav < 30000) {
    if (await page.$(TID('Unlock/Password Input')).catch(() => null)) {
      unlockScreenAt = Date.now() - tNav;
      break;
    }
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(500);
  const storageBytes = await bytesInUse(page);
  log(
    'OPEN swStopped=',
    swStopped,
    '| unlockScreenAt(ms)=',
    unlockScreenAt,
    '| nav=',
    JSON.stringify(await navTiming(page)),
    '| storageBytes=',
    storageBytes
  );

  const reqs = new Map();
  const done = [];
  const key = r => {
    try {
      const u = new URL(r.url());
      return {
        host: u.host,
        path:
          u.pathname.slice(0, 60) +
          (u.search.includes('chainId') ? '?' + (u.search.match(/chainId=\d+/) ?? [''])[0] : '')
      };
    } catch {
      return null;
    }
  };
  page.on('request', r => {
    const k = key(r);
    if (k && !r.url().startsWith('chrome-extension:')) reqs.set(r, { ...k, start: Date.now() });
  });
  page.on('response', r => {
    const q = reqs.get(r.request());
    if (q) done.push({ ...q, end: Date.now(), status: r.status() });
  });
  page.on('requestfailed', r => {
    const q = reqs.get(r);
    if (q) done.push({ ...q, end: Date.now(), status: 'FAIL' });
  });

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.fill(TID('Unlock/Password Input'), PASSWORD);
  const m0 = await metrics(cdp);
  const t0 = Date.now();
  await page.click(TID('Unlock/Unlock Button'));

  const ms = {};
  const mark = (k, t) => {
    ms[k] ??= t;
  };
  const nz = s => s.equity && !/^0([.,]0+)?\s*\$?$/.test(s.equity.trim()) && !/^-/.test(s.equity.trim());
  while (Date.now() - t0 < WINDOW_MS) {
    const s = await pollState(page);
    const t = Date.now() - t0;
    if (s) {
      if (s.unlocked) mark('unlockScreenGone', t);
      if (s.items > 0) mark('firstAssetRow', t);
      if (s.balanceRows > 0) mark('firstBalanceRow', t);
      if (s.nonZeroFiat > 0) mark('firstFiatValue', t);
      if (nz(s)) mark('equityNonZero', t);
      if (s.skeletons === 0 && s.items > 0) mark('noSkeletons', t);
    }
    if (ms.noSkeletons && t > ms.noSkeletons + 3000) break;
    await page.waitForTimeout(50);
  }
  const cost = delta(m0, await metrics(cdp));
  const final = await pollState(page);
  const missing = await missingSelectors(page, ['token rows', 'token balances', 'total balance', 'account name']);
  if (missing.length) log(`MISSING: ${missing.join(', ')} — a test id may have changed; see perf/lib.mjs`);

  const api = done
    .filter(d => /madfish|templewallet/.test(d.host))
    .map(d => ({ ...d, e: d.end - t0 }))
    .sort((a, b) => a.e - b.e);
  const firstRow = ms.firstBalanceRow ?? Infinity;
  const before = api
    .filter(d => d.e <= firstRow)
    .slice(-6)
    .map(d => `${d.e}ms ${d.status} ${d.host.split('.')[0]}${d.path}`);
  const byPath = {};
  for (const d of api) {
    const k = d.path.replace(/\?.*/, '');
    byPath[k] ??= { n: 0, firstEnd: d.e, lastEnd: d.e };
    byPath[k].n++;
    byPath[k].firstEnd = Math.min(byPath[k].firstEnd, d.e);
    byPath[k].lastEnd = Math.max(byPath[k].lastEnd, d.e);
  }

  log('UNLOCK milestones(ms)=', JSON.stringify(ms));
  log('cost (main thread, ms)=', JSON.stringify(cost));
  const crash = crashSummary(await readCrashes(page));
  log('final state=', JSON.stringify(final));
  log('crashes:', crash.line);
  log('api responses by path=', JSON.stringify(byPath));
  log('api responses just before first balance row=', JSON.stringify(before));
  log('responses in window=', done.length);
  result({
    probe: 'unlock',
    coldOpenMs: unlockScreenAt,
    storageBytes,
    milestones: ms,
    cost,
    lifiListFetched: Object.keys(byPath).some(path => path.includes('swap-tokens')),
    missing,
    crashes: crash.crashes,
    crash: crash.crash
  });
  await ctx.close();
};
main().catch(e => {
  console.error(`[${TAG}] FAILED`, e);
  process.exit(1);
});
