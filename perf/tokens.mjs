// Moment 2: tokens page open (×OPENS), then frames, scroll-gesture cost (each ×GESTURES, so their spread is visible) and
// memory at the initial list and after expanding it by scrolling to the end and back to the top. A crash while
// scrolling, a wallet that locked itself or a list that vanished is reported as such instead of measuring the screen
// that replaced the list. Env: TAG, OPENS (default 3), GESTURES (default 3).
import {
  launch,
  unlockIfNeeded,
  dismissModals,
  pollState,
  metrics,
  delta,
  memory,
  countItems,
  scrollToBottomPatiently,
  setScroll,
  frameTest,
  readCrashes,
  readFocusLoss,
  walletLocked,
  accountName,
  missingSelectors,
  crashSummary,
  result,
  RATE,
  screenText
} from './lib.mjs';

const TAG = process.env.TAG ?? 'tokens';
const OPENS = +(process.env.OPENS ?? 3);
const GESTURES = +(process.env.GESTURES ?? 3);
const log = (...a) => console.log(`[${TAG}]`, ...a);

/** Why the list is not there any more, for the log. */
const goneReason = scroll =>
  scroll.locked
    ? `the wallet locked itself ${scroll.after} s into the probe (${scroll.focusLoss.join(', ') || 'the page never lost focus'})`
    : `the list vanished ${scroll.after} s into the probe (page shows: ${scroll.screen})`;

async function measureOpen(page, cdp) {
  await page.evaluate(() => {
    location.hash = '#/';
  });
  await page.waitForTimeout(3000);
  await dismissModals(page);
  const m0 = await metrics(cdp);
  const t0 = Date.now();
  await page.evaluate(() => {
    location.hash = '#/tokens';
  });
  const ms = {};
  const mark = (k, t) => {
    ms[k] ??= t;
  };
  while (Date.now() - t0 < 15000 * Math.max(1, RATE)) {
    const s = await pollState(page);
    const t = Date.now() - t0;
    if (s) {
      if (s.items > 0) mark('firstRow', t);
      if (s.items >= 20) mark('rows20', t);
      if (s.balanceRows >= 20) mark('balanceRows20', t);
      if (s.items > 0 && s.skeletons === 0 && s.balanceRows >= Math.min(20, s.items)) mark('settled', t);
    }
    if (ms.settled && t > ms.settled + 2500) break;
    await page.waitForTimeout(30);
  }
  return { ms, cost: delta(m0, await metrics(cdp)) };
}

async function oscillate(page, cycles = 8) {
  for (let i = 0; i < cycles; i++) {
    await setScroll(page, 500);
    await page.waitForTimeout(200);
    await setScroll(page, 0);
    await page.waitForTimeout(200);
  }
}

/** Frame timings and scroll-gesture cost for the list as it is now, each measured GESTURES times from the top. */
async function measureScrolling(page, cdp, label) {
  const frames = [];
  const gestures = [];
  for (let i = 1; i <= GESTURES; i++) {
    await setScroll(page, 0);
    await page.waitForTimeout(500);
    frames.push(await frameTest(page));
    log(`FRAMES ${label} #${i}:`, JSON.stringify(frames.at(-1)));
    await setScroll(page, 0);
    await page.waitForTimeout(500);
    const g0 = await metrics(cdp);
    await oscillate(page);
    gestures.push(delta(g0, await metrics(cdp)));
    log(`GESTURE ${label} #${i}:`, JSON.stringify(gestures.at(-1)));
  }
  return { frames, gestures };
}

const main = async () => {
  const { ctx, page, startedAt } = await launch();
  const since = () => Math.round((Date.now() - startedAt) / 1000);
  await page.waitForTimeout(3000);
  await unlockIfNeeded(page);
  await page.waitForTimeout(8000);
  await dismissModals(page);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable').catch(() => {});

  const out = { probe: 'tokens', opens: [] };
  out.account = await accountName(page);
  log('active account:', out.account);
  for (let i = 1; i <= OPENS; i++) {
    out.opens.push(await measureOpen(page, cdp));
    log(`OPEN #${i}:`, JSON.stringify(out.opens.at(-1)));
  }

  await setScroll(page, 0);
  await page.waitForTimeout(1000);
  out.atOpen = { ...(await countItems(page)), ...(await memory(cdp)) };
  log('at open      :', JSON.stringify(out.atOpen));
  out.missing = await missingSelectors(page, ['token rows', 'token balances', 'list scroller']);
  if (out.missing.length) log(`MISSING: ${out.missing.join(', ')} — a test id may have changed; see perf/lib.mjs`);
  ({ frames: out.framesOpen, gestures: out.gesturesOpen } = await measureScrolling(page, cdp, 'at open'));

  out.scroll = await scrollToBottomPatiently(page);
  // A list that shrank to almost nothing without an error event is gone too (e.g. the app went blank).
  const rowsLeft = (await countItems(page)).rows;
  if (!out.scroll.crashed && !out.scroll.locked && out.atOpen.rows > 0 && rowsLeft < out.atOpen.rows / 2)
    out.scroll.vanished = true;
  if (out.scroll.locked || out.scroll.vanished) {
    out.scroll.after = since();
    out.scroll.focusLoss = await readFocusLoss(page);
    if (out.scroll.vanished) out.scroll.screen = await screenText(page);
  }
  log('scrolled     :', JSON.stringify(out.scroll));
  if (out.scroll.crashed) {
    // The error screen is not a list: measuring it would report a tiny heap and perfect frames.
    log(`at bottom    : CRASHED after ~${out.scroll.items} rows`);
  } else if (out.scroll.locked || out.scroll.vanished) {
    // Neither is the unlock screen or a blank page.
    log(`at bottom    : NOT MEASURED, ${goneReason(out.scroll)}`);
  } else {
    await page.waitForTimeout(2500);
    out.atBottom = { ...(await countItems(page)), ...(await memory(cdp)) };
    log('at bottom    :', JSON.stringify(out.atBottom));
    await setScroll(page, 0);
    await page.waitForTimeout(3000);
    log('back at top  :', JSON.stringify({ ...(await countItems(page)), ...(await memory(cdp)) }));
    ({ frames: out.framesExpanded, gestures: out.gesturesExpanded } = await measureScrolling(page, cdp, 'expanded'));
    if (await walletLocked(page)) {
      // The unlock screen replaced the list at some point during these gestures, so their numbers are not the list's.
      Object.assign(out.scroll, { locked: true, after: since(), focusLoss: await readFocusLoss(page) });
      delete out.framesExpanded;
      delete out.gesturesExpanded;
      log(`expanded     : DISCARDED, ${goneReason(out.scroll)}`);
    }
  }
  const crash = crashSummary(await readCrashes(page));
  log('crashes:', crash.line);
  result({ ...out, crashes: crash.crashes, crash: crash.crash });
  await ctx.close();
};
main().catch(e => {
  console.error(`[${TAG}] FAILED`, e);
  process.exit(1);
});
