// Shared helpers for the perf probes. Runs the built extension under Playwright's Chromium.
// Env: TW_EXT (built extension dir), TW_PROFILE (a browser profile folder, used as it is) or TW_PROFILE_NAME (which
// test wallet, default "whale"; a probe run by hand uses its `-scratch` copy), TW_PASSWORD, TW_API_CACHE (see
// installApiCache).
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const playwright = await import('../e2e/node_modules/playwright/index.mjs').catch(() => null);
if (!playwright) {
  console.error('Playwright is not installed. Run `cd e2e && yarn` once, then try again.');
  process.exit(2);
}
const { chromium } = playwright;

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const EXT = process.env.TW_EXT ?? path.join(ROOT, 'dist', 'chrome_unpacked');
export const PROFILES = path.join(os.tmpdir(), 'temple-perf-profiles');
const PROFILE_NAME = process.env.TW_PROFILE_NAME ?? 'whale';
export const PROFILE = process.env.TW_PROFILE ?? path.join(PROFILES, PROFILE_NAME);
/**
 * The wallet writes to its profile on every run, so a probe started by hand runs on `<name>-scratch`, a copy made on
 * first use, and the wallet setup.mjs created stays as it was for comparisons. TW_PROFILE selects a folder to use as it
 * is (compare.mjs sets it to its own fresh copies).
 */
const scratchProfile = () => {
  if (process.env.TW_PROFILE) return PROFILE;
  if (!fs.existsSync(PROFILE)) {
    console.error(`No test wallet at ${PROFILE}: run \`node perf/setup.mjs\` once, then try again.`);
    process.exit(2);
  }
  const scratch = `${PROFILE}-scratch`;
  if (!fs.existsSync(scratch)) {
    fs.cpSync(PROFILE, scratch, { recursive: true });
    console.warn(`[perf] copied ${PROFILE_NAME} to ${path.basename(scratch)}; probes run by hand use that copy`);
  }
  return scratch;
};
export const PASSWORD = process.env.TW_PASSWORD ?? 'Test123!Test123!';
export const TID = s => `[data-testid="${s}"]`;
export const SCROLLER = '#app-content-paper';
/** Traces and failure screenshots; git-ignored. */
export const OUT_DIR = path.join(ROOT, 'perf', 'out');
/**
 * Every token row: a rendered item or a placeholder for one outside the visibility window. Builds from before the
 * placeholder test id existed are counted by the inline style every row carries; the probes take whichever finds more.
 */
export const TOKEN_ROW = '[data-testid="Assets/Asset Item Button"], [data-testid="Assets/Asset Item Placeholder"]';
export const TOKEN_ROW_LEGACY = '[style*="content-visibility"]';
/** CPU throttling of the page (renderer main thread only), e.g. RATE=4 as a slow-laptop proxy. */
export const RATE = +(process.env.RATE ?? 1);

/** One machine-readable line per result; perf/compare.mjs reads only these. */
export const result = data => console.log(`RESULT ${JSON.stringify(data)}`);

export const API_CACHE = process.env.TW_API_CACHE ?? null;
/** compare.mjs sets this for the warm-up probes: answers the server throttled are fetched again, slowly, for the cache. */
const API_CACHE_FILL = process.env.TW_API_CACHE_FILL === '1';
/** How long a warm-up probe keeps filling the cache after its browser has closed. */
const FILL_DRAIN_MS = 3 * 60_000;
/** Wallet-data endpoints whose payload size drives how much work the app then does: Temple's API, TzKT and objkt. */
const CACHEABLE_API = /madfish|templewallet|tzkt|objkt/;
/** Printed at exit, so a comparison can show whether every build really replayed the same API data. */
const apiCacheStats = { installed: false, hits: 0, recorded: 0, throttled: 0, httpErrors: 0, failed: 0, lost: 0 };
/** Live answers that were not recorded, by status and endpoint: tells icon 404s apart from API throttling. */
const unrecordedAnswers = new Map();
let fillLane = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const FILL_HEADERS = ['accept', 'content-type', 'origin', 'referer', 'user-agent'];
/** `Retry-After` as milliseconds to wait (seconds or an HTTP date); null when absent or unreadable. */
const retryAfterMs = value => {
  if (!value) return null;
  const ms = /^\d+$/.test(value.trim()) ? Number(value) * 1000 : Date.parse(value) - Date.now();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
};
const humanDuration = ms =>
  ms >= 86_400_000
    ? `${Math.round(ms / 86_400_000)} days`
    : ms >= 3_600_000
      ? `${Math.round(ms / 3_600_000)} hours`
      : `${Math.max(1, Math.round(ms / 60_000))} min`;

/**
 * Remembers the answers the server throttled and, once the browser is closed and the app's own requests have stopped,
 * fetches them once more, one at a time with a pause between them, backing off on every new 429 and honouring
 * Retry-After, and records what it gets. Only the cache sees these answers: the app already got its 429, so the warm-up
 * behaves as it would anyway, and the measured probes then replay a complete set. Fetching while the app is still
 * running does not work: an old build keeps the rate limit busy for as long as its page is open. A server that asks to
 * come back later than the lane can wait, or refuses eight attempts in a row, is not cooling down: the lane gives up.
 */
export function createFillLane() {
  const queue = [];
  const seen = new Set();
  const stats = { filled: 0, failed: 0, left: 0, reason: null };

  return {
    stats,
    add(req, file) {
      if (seen.has(file)) return;
      seen.add(file);
      queue.push({
        file,
        method: req.method(),
        url: req.url(),
        headers: Object.fromEntries(Object.entries(req.headers()).filter(([k]) => FILL_HEADERS.includes(k))),
        body: req.postData() ?? undefined,
        attempts: 0
      });
    },
    async drain(maxMs) {
      const deadline = Date.now() + maxMs;
      const request = await playwright.request.newContext();
      let intervalMs = 250;
      let pauseUntil = 0;
      let refusedInARow = 0;
      while (queue.length && Date.now() < deadline) {
        await sleep(Math.min(Math.max(intervalMs, pauseUntil - Date.now()), Math.max(0, deadline - Date.now())));
        const item = queue.shift();
        if (fs.existsSync(item.file)) continue; // another warm-up probe recorded it meanwhile
        let response;
        try {
          response = await request.fetch(item.url, {
            method: item.method,
            headers: item.headers,
            data: item.body,
            maxRedirects: 0,
            timeout: 20_000
          });
        } catch {
          stats.failed++;
          continue;
        }
        const status = response.status();
        if (status === 429 || status >= 500) {
          const retryAfter = retryAfterMs(response.headers()['retry-after']);
          if (retryAfter > maxMs) stats.reason = `the server asks to come back in ${humanDuration(retryAfter)}`;
          else if (++refusedInARow >= 8) stats.reason = 'the server refused 8 attempts in a row';
          if (stats.reason) {
            queue.unshift(item);
            break;
          }
          pauseUntil = Date.now() + Math.min(retryAfter ?? intervalMs * 4, 60_000);
          intervalMs = Math.min(intervalMs * 2, 5000);
          if (++item.attempts < 4) queue.push(item);
          else stats.failed++;
          continue;
        }
        refusedInARow = 0;
        intervalMs = Math.max(250, intervalMs / 2);
        const body = await response.body().catch(() => Buffer.alloc(0));
        fs.writeFileSync(
          item.file,
          JSON.stringify({ status, headers: response.headers(), bodyBase64: body.toString('base64') })
        );
        stats.filled++;
      }
      await request.dispose().catch(() => {});
      stats.left = queue.length;
      queue.length = 0;
    }
  };
}

/**
 * Serve wallet API responses from a directory on disk, recording them on first miss.
 *
 * Without this, two builds see different data: the staging API rate-limits (429) under repeated runs, so one build
 * gets a full token list and the other only native tokens, and every downstream number — script time, row count,
 * memory — silently compares different workloads. Replaying a recorded set makes runs comparable and removes the
 * rate limit. Point two builds at the same cache directory to compare them. GET and POST answers are recorded (Tezos
 * token metadata and objkt's GraphQL are POSTs, keyed by their body); TzKT's websocket handshake is left alone.
 */
async function installApiCache(ctx, dir) {
  fs.mkdirSync(dir, { recursive: true });
  apiCacheStats.installed = true;
  if (API_CACHE_FILL) fillLane = createFillLane();
  const keyFor = req =>
    crypto
      .createHash('sha1')
      .update(`${req.method()} ${req.url()}\n${req.postData() ?? ''}`)
      .digest('hex')
      .slice(0, 24);
  // `body()` returns the decoded payload, so the encoding and length headers of the original response no longer apply.
  const replayHeaders = headers =>
    Object.fromEntries(
      Object.entries(headers).filter(([k]) => !['content-encoding', 'content-length'].includes(k.toLowerCase()))
    );

  await ctx.route(
    url => CACHEABLE_API.test(url.host),
    route =>
      answerFromCache(route).catch(error => {
        // Under a request storm Playwright may collect a route before it is answered; losing that one answer must not
        // end the whole probe. Count it so a run that lost many answers is visible.
        if (++apiCacheStats.lost === 1) console.warn('[api-cache] lost an answer:', error?.message?.split('\n')[0]);
      })
  );

  async function answerFromCache(route) {
    const req = route.request();
    if (!['GET', 'POST'].includes(req.method()) || /\/ws(\/|$)/.test(new URL(req.url()).pathname))
      return route.continue();

    const file = path.join(dir, `${keyFor(req)}.json`);
    if (fs.existsSync(file)) {
      const hit = JSON.parse(fs.readFileSync(file, 'utf8'));
      apiCacheStats.hits++;
      return route.fulfill({
        status: hit.status,
        headers: replayHeaders(hit.headers),
        body: Buffer.from(hit.bodyBase64, 'base64')
      });
    }

    let response;
    try {
      response = await route.fetch({ maxRedirects: 0 });
    } catch {
      apiCacheStats.failed++;
      return route.abort('failed');
    }

    const body = await response.body().catch(() => Buffer.alloc(0));
    const headers = response.headers();
    // A 404 (a missing icon) is a real answer: replaying it keeps both versions on the same data and stops thousands of
    // live requests per run. Throttled (429) and server-error answers are not recorded, or they would be replayed
    // forever as if they were the real data.
    if (response.status() < 500 && response.status() !== 429) {
      fs.writeFileSync(
        file,
        JSON.stringify({ status: response.status(), headers, bodyBase64: body.toString('base64') })
      );
      apiCacheStats.recorded++;
    } else {
      if (response.status() === 429) {
        apiCacheStats.throttled++;
        fillLane?.add(req, file);
      } else apiCacheStats.httpErrors++;
      const { host, pathname } = new URL(req.url());
      // Up to three path segments; an id-like segment (an IPFS CID, a hash) and everything after it becomes `*`.
      const segments = pathname.split('/').slice(0, 4);
      const idAt = segments.findIndex(segment => segment.length > 20);
      const endpoint = (idAt === -1 ? segments : [...segments.slice(0, idAt), '*']).join('/');
      const key = `${response.status()} ${host}${endpoint}`;
      unrecordedAnswers.set(key, (unrecordedAnswers.get(key) ?? 0) + 1);
    }

    return route.fulfill({ status: response.status(), headers: replayHeaders(headers), body });
  }
}

process.on('exit', () => {
  if (!apiCacheStats.installed) return;
  const { hits, recorded, throttled, httpErrors, failed, lost } = apiCacheStats;
  console.warn(
    `[api-cache] hits=${hits} recorded=${recorded} throttled=${throttled} httpErrors=${httpErrors} failed=${failed} lost=${lost}`
  );
  const topErrors = [...unrecordedAnswers].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topErrors.length)
    console.warn(
      `[api-cache] not recorded (status endpoint × count): ${topErrors.map(([k, n]) => `${k} ×${n}`).join(', ')}`
    );
  if (fillLane) {
    const { filled: f, failed: gaveUp, left, reason } = fillLane.stats;
    console.warn(
      `[api-cache] warm-up fill: ${f} throttled answers fetched again and recorded, ${gaveUp} given up, ${left} left${reason ? ` (${reason})` : ''}`
    );
  }
  result({ probe: 'api-cache', hits, recorded, throttled, httpErrors, failed, lost, topErrors, fill: fillLane?.stats });
});

/**
 * The app's error boundary swallows render errors: the page shows "Oops! Something went wrong" and nothing reaches the
 * console or CDP. The boundary does dispatch a `temple-error` event; this keeps each one on `window.__templeErrors`.
 * It also keeps every moment the page lost focus or was hidden on `window.__templeFocusLoss`: the wallet schedules a
 * lock on those, so they explain a list that turned into the unlock screen. Runs in the page, so it must not use
 * anything from this module.
 */
const capturePageSignals = () => {
  if (window.__templeErrors) return;
  window.__templeErrors = [];
  window.__templeFocusLoss = [];
  const lines = (text, from, count) =>
    String(text ?? '')
      .split('\n')
      .slice(from)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, count)
      .join(' | ');
  window.addEventListener('temple-error', event => {
    const { error, componentStack } = event.detail ?? {};
    window.__templeErrors.push({
      error: `${error?.name ?? 'Error'}: ${error?.message ?? String(error)}`,
      stack: lines(error?.stack, 1, 3),
      components: lines(componentStack, 0, 4)
    });
  });
  const at = () => `${Math.round(performance.now() / 1000)} s after the page loaded`;
  window.addEventListener('blur', () => window.__templeFocusLoss.push(`focus lost ${at()}`), true);
  document.addEventListener(
    'visibilitychange',
    () => document.visibilityState === 'hidden' && window.__templeFocusLoss.push(`hidden ${at()}`),
    true
  );
};

/** Error-boundary crashes captured on `page` so far. */
export const readCrashes = page => page.evaluate(() => window.__templeErrors ?? []).catch(() => []);
/** When `page` lost focus or was hidden, as text; empty when it never happened. */
export const readFocusLoss = page => page.evaluate(() => window.__templeFocusLoss ?? []).catch(() => []);
/** Whether `page` shows the unlock screen now. */
export const walletLocked = page =>
  page
    .$(TID('Unlock/Password Input'))
    .then(Boolean)
    .catch(() => false);

/**
 * The wallet locks itself after 5 minutes without mouse or keyboard input, and scripted scrolling sends none, so a long
 * probe would end up measuring the unlock screen: nudge the pointer now and then, as a user reading the page would.
 */
const keepWalletActive = page => {
  let i = 0;
  const timer = setInterval(() => {
    if (page.isClosed()) return clearInterval(timer);
    page.mouse.move(1 + (i++ % 2), 1).catch(() => {});
  }, 30_000);
  timer.unref();
};

/** Display sleep or a screen lock makes the wallet lock itself mid-measurement; on macOS hold the display awake. */
const keepDisplayAwake = () => {
  if (process.platform !== 'darwin') return;
  spawn('caffeinate', ['-dims', '-w', String(process.pid)], { detached: true, stdio: 'ignore' })
    .on('error', () => {})
    .unref();
};

/** For a probe's `crashes:` line (`none`, or the count and the first error with where it was thrown) and its result. */
export const crashSummary = crashes => ({
  crashes: crashes.length,
  crash: crashes[0]?.error ?? null,
  line: crashes.length
    ? `${crashes.length} — ${crashes[0].error} @ ${crashes[0].stack}`.replace(/chrome-extension:\/\/[a-z]+\//g, '')
    : 'none'
});

export async function launch({
  headless = false,
  extraArgs = [],
  apiCache = API_CACHE,
  profile = scratchProfile()
} = {}) {
  keepDisplayAwake();
  const startedAt = Date.now();
  const ctx = await chromium.launchPersistentContext(profile, {
    headless,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--disable-notifications', ...extraArgs]
  });
  await ctx.addInitScript(capturePageSignals);
  if (apiCache) await installApiCache(ctx, apiCache);
  if (fillLane) {
    // Close first, so the app stops hitting the rate limit, then fetch what it was refused.
    const close = ctx.close.bind(ctx);
    ctx.close = async () => {
      await close();
      await fillLane.drain(FILL_DRAIN_MS);
    };
  }
  const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker', { timeout: 30000 }));
  const extId = sw.url().split('/')[2];

  let page = ctx.pages().find(p => p.url().includes(extId));
  for (let i = 0; i < 40 && !page; i++) {
    await new Promise(r => setTimeout(r, 250));
    page = ctx.pages().find(p => p.url().includes(extId));
  }
  page ??= await ctx.newPage();
  if (!page.url().includes(extId)) await page.goto(`chrome-extension://${extId}/fullpage.html`);
  // On a fresh install the extension opens its own tab and closes other fullpage tabs; re-resolve after that settles.
  await new Promise(r => setTimeout(r, 1500));
  if (page.isClosed()) {
    page = ctx.pages().find(p => !p.isClosed() && p.url().includes(extId)) ?? (await ctx.newPage());
    if (!page.url().includes(extId)) await page.goto(`chrome-extension://${extId}/fullpage.html`);
  }
  await page.bringToFront();
  // A page that loaded before the init script was registered gets the listeners now.
  await page.evaluate(capturePageSignals).catch(() => {});
  await applyRate(ctx, page);
  keepWalletActive(page);
  return { ctx, page, extId, startedAt };
}

const rateSessions = new WeakMap();
/** RATE CPU throttling for the page. A full page load resets it, so call it again right after `page.goto`. */
export async function applyRate(ctx, page) {
  if (RATE <= 1) return;
  const cdp = await ctx.newCDPSession(page);
  rateSessions.set(page, cdp); // keep the session attached: throttling ends with it
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
}

/** What the page shows instead of a list that disappeared (an error screen, the unlock screen, a blank page). */
export const screenText = page =>
  page
    .evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) || '(blank page)')
    .catch(() => '(page closed)');

/** Returns the first open extension page that currently shows `selector`, polling up to `timeoutMs`. */
export async function findPageWith(ctx, extId, selector, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    for (const p of ctx.pages()) {
      if (p.isClosed() || !p.url().includes(extId)) continue;
      if (await p.$(selector).catch(() => null)) return p;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  const details = [];
  let shot = 0;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const p of ctx.pages()) {
    if (p.isClosed()) continue;
    const state = p.url().includes(extId) ? await dumpPage(p) : null;
    if (state) await p.screenshot({ path: path.join(OUT_DIR, `failure-${++shot}.png`) }).catch(() => {});
    details.push(`${p.url()}${state ? ` → ${JSON.stringify(state)}` : ''}`);
  }
  throw new Error(
    `No open extension page shows ${selector} within ${timeoutMs} ms (screenshots: perf/out/failure-N.png).\n  ${details.join('\n  ')}`
  );
}

/** What an extension page is showing: distinct testids, visible button labels, and the first lines of text. */
export const dumpPage = page =>
  page
    .evaluate(() => ({
      testids: [
        ...new Set([...document.querySelectorAll('[data-testid]')].map(e => e.getAttribute('data-testid')))
      ].slice(0, 25),
      buttons: [...document.querySelectorAll('button')]
        .map(b => b.textContent.trim())
        .filter(Boolean)
        .slice(0, 12),
      text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200)
    }))
    .catch(e => ({ error: String(e).slice(0, 120) }));

export async function stopServiceWorkers(ctx, page) {
  const cdp = await ctx.newCDPSession(page);
  try {
    await cdp.send('ServiceWorker.enable');
    await cdp.send('ServiceWorker.stopAllWorkers');
    return true;
  } catch (e) {
    return String(e.message).slice(0, 80);
  } finally {
    await cdp.detach().catch(() => {});
  }
}

export async function unlockIfNeeded(page) {
  const pw = await page.$(TID('Unlock/Password Input'));
  if (!pw) return false;
  await pw.fill(PASSWORD);
  await page.click(TID('Unlock/Unlock Button'));
  await page.waitForTimeout(2000);
  return true;
}

export async function dismissModals(page) {
  for (let i = 0; i < 6; i++) {
    const closers = await page.$$('[data-testid*="Close"], [data-testid*="close"]');
    let clicked = false;
    for (const c of closers) {
      if (await c.isVisible().catch(() => false)) {
        await c.click().catch(() => {});
        clicked = true;
        await page.waitForTimeout(400);
        break;
      }
    }
    if (!clicked) break;
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

/** `items` counts rendered rows only; `rows` every row, placeholders included. */
export const countItems = page =>
  page.evaluate(
    ([row, legacyRow]) => ({
      items: document.querySelectorAll('[data-testid="Assets/Asset Item Button"]').length,
      rows: Math.max(document.querySelectorAll(row).length, document.querySelectorAll(legacyRow).length),
      renderedBalances: document.querySelectorAll('[data-testid="Assets/Asset Item Crypto Balance Button"]').length,
      domNodes: document.getElementsByTagName('*').length
    }),
    [TOKEN_ROW, TOKEN_ROW_LEGACY]
  );

/** The active account's name: from its test id, or, on builds from before it, the text next to the account icon. */
export const accountName = page =>
  page
    .evaluate(
      () =>
        document.querySelector('[data-testid="Home/Account Name"]')?.textContent?.trim() ??
        document.querySelector('[data-testid="Home/Account Icon"]')?.parentElement?.textContent?.trim() ??
        null
    )
    .catch(() => null);

/**
 * What the probes look for, by the name a report can print. A UI change that drops one of these would otherwise turn a
 * row into "—" without a word; `missingSelectors` says which are absent, and the report repeats it under Broken.
 */
const EXPECTED = {
  'token rows': { any: [TOKEN_ROW, TOKEN_ROW_LEGACY] },
  'token balances': { any: ['[data-testid="Assets/Asset Item Crypto Balance Button"]'] },
  'total balance': { any: ['[data-testid="Total Equity/Value"]'], text: 'Total Equity Value' },
  'account name': { any: ['[data-testid="Home/Account Name"]', '[data-testid="Home/Account Icon"]'] },
  'list scroller': { any: [SCROLLER] },
  'NFT tiles': { any: ['[data-testid="Nfts Page/Collectible Item"]'] }
};
/** The names among `names` (keys of EXPECTED) that match nothing on `page` right now. */
export const missingSelectors = (page, names) =>
  page
    .evaluate(
      checks =>
        checks
          .filter(
            ([, { any, text }]) =>
              !any.some(selector => document.querySelector(selector)) &&
              !(text && document.body.innerText.includes(text))
          )
          .map(([name]) => name),
      names.map(name => [name, EXPECTED[name]])
    )
    .catch(() => []);

export const pollState = page =>
  page
    .evaluate(() => {
      const items = document.querySelectorAll('[data-testid="Assets/Asset Item Button"]').length;
      const balanceRows = document.querySelectorAll('[data-testid="Assets/Asset Item Crypto Balance Button"]').length;
      const fiat = [...document.querySelectorAll('[data-testid="Assets/Asset Item Fiat Balance Button"]')].map(e =>
        e.textContent.trim()
      );
      const nonZeroFiat = fiat.filter(t => t && !/^\$?0(\.0+)?\s*\$?$/.test(t) && !/^-+$/.test(t)).length;
      // Builds from before the test id: the value follows the "Total Equity Value" label in the page text.
      const equity =
        document.querySelector('[data-testid="Total Equity/Value"]')?.textContent?.trim() ??
        (document.body.innerText.match(/Total Equity Value\s*\n?\s*([^\n]+)/) ?? [])[1] ??
        null;
      const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]').length;
      return {
        items,
        balanceRows,
        nonZeroFiat,
        equity,
        skeletons,
        unlocked: !document.querySelector('[data-testid="Unlock/Password Input"]')
      };
    })
    .catch(() => null);

export const navTiming = page =>
  page
    .evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return n
        ? {
            responseEnd: +n.responseEnd.toFixed(0),
            domInteractive: +n.domInteractive.toFixed(0),
            domContentLoaded: +n.domContentLoadedEventEnd.toFixed(0)
          }
        : null;
    })
    .catch(() => null);

export const bytesInUse = page =>
  page.evaluate(() => new Promise(r => chrome.storage.local.getBytesInUse(null, b => r(b)))).catch(() => null);

export const KEYS = [
  'ScriptDuration',
  'LayoutDuration',
  'RecalcStyleDuration',
  'TaskDuration',
  'LayoutCount',
  'RecalcStyleCount'
];
export async function metrics(cdp) {
  const { metrics: m } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(m.filter(x => KEYS.includes(x.name)).map(x => [x.name, x.value]));
}
export const delta = (a, b) =>
  Object.fromEntries(KEYS.map(k => [k, +(((b[k] ?? 0) - (a[k] ?? 0)) * (k.endsWith('Count') ? 1 : 1000)).toFixed(1)]));

const MEM_KEYS = ['Nodes', 'JSEventListeners', 'JSHeapUsedSize', 'Documents'];
export async function memory(cdp) {
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  await new Promise(r => setTimeout(r, 500));
  const { metrics: m } = await cdp.send('Performance.getMetrics');
  const o = Object.fromEntries(m.filter(x => MEM_KEYS.includes(x.name)).map(x => [x.name, x.value]));
  return {
    nodes: o.Nodes,
    listeners: o.JSEventListeners,
    heapMB: +(o.JSHeapUsedSize / 1048576).toFixed(1),
    documents: o.Documents
  };
}

/**
 * Scrolls the list to its end, waiting for more rows to load, until its height has not grown for `stableMs`, and stops
 * at an error-boundary crash, when the wallet shows its unlock screen (`locked`) or when a list that had items has none
 * left (`vanished`). `items` is the most `itemSelector` matches seen, i.e. how far the list got before that;
 * `reachedEnd` is false when `maxSteps` ran out first, so the list was measured before it was fully expanded.
 */
export async function scrollToBottomPatiently(
  page,
  {
    maxSteps = 400,
    itemSelector = TOKEN_ROW,
    legacySelector = itemSelector === TOKEN_ROW ? TOKEN_ROW_LEGACY : null,
    stableMs = 10_000
  } = {}
) {
  const STEP_MS = 700;
  const stableSteps = Math.ceil(stableMs / STEP_MS);
  let lastHeight = -1;
  let stable = 0;
  let items = 0;
  let steps = 0;
  let gone = null;
  for (; steps < maxSteps; steps++) {
    const state = await page
      .evaluate(
        ([scroller, item, legacyItem, unlockInput]) => {
          const target = document.querySelector(scroller) ?? document.scrollingElement;
          const count = Math.max(
            document.querySelectorAll(item).length,
            legacyItem ? document.querySelectorAll(legacyItem).length : 0
          );
          target.scrollTop = target.scrollHeight;
          return {
            count,
            height: target.scrollHeight,
            crashed: (window.__templeErrors?.length ?? 0) > 0,
            locked: Boolean(document.querySelector(unlockInput))
          };
        },
        [SCROLLER, itemSelector, legacySelector, TID('Unlock/Password Input')]
      )
      .catch(() => null);
    if (!state) break;
    items = Math.max(items, state.count);
    if (state.crashed) break;
    if (state.locked || (items > 0 && state.count === 0)) {
      gone = state.locked ? 'locked' : 'vanished';
      break;
    }
    await page.waitForTimeout(STEP_MS);
    if (state.height === lastHeight) {
      if (++stable >= stableSteps) break;
    } else stable = 0;
    lastHeight = state.height;
  }

  return {
    crashed: (await readCrashes(page)).length > 0,
    items,
    steps,
    reachedEnd: stable >= stableSteps,
    locked: gone === 'locked',
    vanished: gone === 'vanished'
  };
}
export const setScroll = (page, top) =>
  page.evaluate(
    ([s, t]) => {
      (document.querySelector(s) ?? document.scrollingElement).scrollTop = t;
    },
    [SCROLLER, top]
  );

export const frameTest = (page, frames = 150, px = 8) =>
  page
    .evaluate(
      ([sel, frames, px]) =>
        new Promise(res => {
          const t = document.querySelector(sel) ?? document.scrollingElement;
          const deltas = [];
          let last = performance.now();
          let n = 0;
          const step = () => {
            const now = performance.now();
            deltas.push(now - last);
            last = now;
            t.scrollTop += px;
            if (++n < frames) requestAnimationFrame(step);
            else res(deltas.slice(2));
          };
          requestAnimationFrame(step);
        }),
      [SCROLLER, frames, px]
    )
    .then(d => {
      const s = [...d].sort((a, b) => a - b);
      const p = q => s[Math.floor((s.length - 1) * q)];
      return {
        medianMs: +p(0.5).toFixed(1),
        p95Ms: +p(0.95).toFixed(1),
        maxMs: +s[s.length - 1].toFixed(1),
        over33ms: d.filter(x => x > 33).length,
        over100ms: d.filter(x => x > 100).length,
        frames: d.length
      };
    });
