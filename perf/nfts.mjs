// NFTs page: unlocks, opens #/nfts, and counts every request started in WINDOW_MS by kind (RPC POST, IPFS, Temple API,
// images, other), plus socket exhaustion (ERR_INSUFFICIENT_RESOURCES) and the in-view tiles' state at the end. Then
// scrolls the grid for up to NFT_SCROLL_STEPS steps to catch a tile that crashes the page, goes to Home, locks from the
// account menu, and counts requests for LOCKED_WINDOW_MS more (bulk loading must stop). A wallet that locked itself
// or a grid that vanished is reported as such.
// Env: TW_EXT, TW_PROFILE_NAME, TW_API_CACHE, TAG, WINDOW_MS (default 60000), NFT_SCROLL_STEPS (default 60),
// LOCKED_WINDOW_MS (default 30000; 0 skips the lock).
import {
  launch,
  TID,
  SCROLLER,
  unlockIfNeeded,
  dismissModals,
  scrollToBottomPatiently,
  readCrashes,
  readFocusLoss,
  walletLocked,
  missingSelectors,
  crashSummary,
  result,
  screenText
} from './lib.mjs';

const TAG = process.env.TAG ?? 'nftreq';
const WINDOW_MS = Number(process.env.WINDOW_MS ?? 60000);
const LOCKED_WINDOW_MS = Number(process.env.LOCKED_WINDOW_MS ?? 30000);
const NFT_SCROLL_STEPS = Number(process.env.NFT_SCROLL_STEPS ?? 60);
const NFT_TILE = '[data-testid="Nfts Page/Collectible Item"]';
const log = (...a) => console.log(`[${TAG}]`, ...a);

const { ctx, page, startedAt } = await launch();
const since = () => Math.round((Date.now() - startedAt) / 1000);

let phase = 'setup';
const counts = { page: {}, locked: {} };
const failures = { page: {}, locked: {} };

const kindOf = req => {
  let url;
  try {
    url = new URL(req.url());
  } catch {
    return 'other';
  }
  if (url.protocol === 'chrome-extension:' || url.protocol === 'data:') return 'local';
  if (/temple-api|templewallet\.com/.test(url.host) && !url.pathname.startsWith('/ipfs/')) return 'templeApi';
  if (/ipfs/.test(url.host) || url.pathname.startsWith('/ipfs/')) return 'ipfs';
  if (req.resourceType() === 'image') return 'image';
  // Tezos: TzKT and objkt index the chain; RPC reads are GETs on /chains/… paths.
  if (/tzkt|objkt/.test(url.host)) return 'indexer';
  if (url.pathname.includes('/chains/')) return 'rpc';
  if (req.method() === 'POST') return 'rpc';
  return 'other';
};

const bump = (record, key) => void (record[key] = (record[key] ?? 0) + 1);

ctx.on('request', req => {
  if (phase === 'page' || phase === 'locked') bump(counts[phase], kindOf(req));
});
ctx.on('requestfailed', req => {
  if (phase !== 'page' && phase !== 'locked') return;
  const reason = req.failure()?.errorText ?? 'unknown';
  bump(failures[phase], reason.includes('ERR_INSUFFICIENT_RESOURCES') ? 'ERR_INSUFFICIENT_RESOURCES' : reason);
});

const tilesState = () =>
  page.evaluate(
    ([sel, tile]) => {
      const root = document.querySelector(sel) ?? document.body;
      const r = root.getBoundingClientRect();
      const tiles = [...root.querySelectorAll(tile)];
      const inView = tiles.filter(t => {
        const b = t.getBoundingClientRect();
        return b.bottom > r.top && b.top < r.bottom;
      });
      const withImage = inView.filter(t => [...t.querySelectorAll('img')].some(i => i.naturalWidth > 0)).length;
      const spinners = inView.filter(t => t.querySelector('[class*="animate-spin"]')).length;
      return { tiles: tiles.length, inView: inView.length, inViewWithImage: withImage, inViewSpinners: spinners };
    },
    [SCROLLER, NFT_TILE]
  );

const total = record => Object.values(record).reduce((sum, n) => sum + n, 0);

await page.waitForSelector(TID('Unlock/Password Input'), { timeout: 60000 });
await unlockIfNeeded(page);
await dismissModals(page);
await page.evaluate(() => void (location.hash = '#/nfts'));

phase = 'page';
await page.waitForTimeout(WINDOW_MS);
log(`NFTs page, requests started in ${WINDOW_MS / 1000} s: ${total(counts.page)}`, JSON.stringify(counts.page));
log('NFTs page, failed requests:', JSON.stringify(failures.page));
const tiles = await tilesState();
log('tiles at the end:', JSON.stringify(tiles));
const missing = await missingSelectors(page, ['NFT tiles', 'list scroller']);
if (missing.length) log(`MISSING: ${missing.join(', ')} — a test id may have changed; see perf/lib.mjs`);

phase = 'scroll';
const grid =
  NFT_SCROLL_STEPS > 0
    ? await scrollToBottomPatiently(page, { maxSteps: NFT_SCROLL_STEPS, itemSelector: NFT_TILE, stableMs: 5000 })
    : null;
// A grid that shrank to almost nothing without an error event is gone too: record what shows instead.
if (grid && !grid.crashed && !grid.locked && tiles.tiles > 0) {
  const tilesLeft = await page.evaluate(tile => document.querySelectorAll(tile).length, NFT_TILE).catch(() => 0);
  if (tilesLeft < tiles.tiles / 2) grid.vanished = true;
}
if (grid?.locked || grid?.vanished) {
  grid.after = since();
  grid.focusLoss = await readFocusLoss(page);
  if (grid.vanished) grid.screen = await screenText(page);
}
if (grid) log('grid scrolled:', JSON.stringify(grid));
const crash = crashSummary(await readCrashes(page));
log('crashes:', crash.line);

phase = 'locking';
// The account menu (and its Lock item) lives in the Home header, not on the NFTs page.
const lock = async () => {
  try {
    await page.evaluate(() => void (location.hash = '#/'));
    await page.click(TID('Home/Menu Button'), { timeout: 10000 });
    await page.click(TID('Menu Drop-down/Logout Button'), { timeout: 10000 });
    await page.waitForSelector(TID('Unlock/Password Input'), { timeout: 10000 });

    return true;
  } catch {
    return false;
  }
};
// A wallet that locked itself earlier has been draining since an unknown moment, so the after-lock count is skipped.
const lockedItself = Boolean(grid?.locked) || (await walletLocked(page));
const locked = LOCKED_WINDOW_MS > 0 && !lockedItself && (await lock());
if (LOCKED_WINDOW_MS > 0 && lockedItself) {
  log(`the wallet had locked itself by ${since()} s into the probe: the after-lock count is skipped`);
} else if (LOCKED_WINDOW_MS > 0) {
  log(`locked from the menu: ${locked ? 'yes' : 'no (the after-lock count below is not meaningful)'}`);
  phase = 'locked';
  await page.waitForTimeout(LOCKED_WINDOW_MS);
  log(
    `after lock, requests started in ${LOCKED_WINDOW_MS / 1000} s: ${total(counts.locked)}`,
    JSON.stringify(counts.locked)
  );
}

result({
  probe: 'nfts',
  windowS: WINDOW_MS / 1000,
  requests: { total: total(counts.page), byKind: counts.page },
  socketExhaustion: failures.page.ERR_INSUFFICIENT_RESOURCES ?? 0,
  tiles,
  grid,
  locked,
  lockedItself,
  missing,
  afterLock: locked ? { windowS: LOCKED_WINDOW_MS / 1000, total: total(counts.locked), byKind: counts.locked } : null,
  crashes: crash.crashes,
  crash: crash.crash
});
await ctx.close();
