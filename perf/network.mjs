// Network shape after unlock, optionally with a fault injected. Env: MODE=none|dns|route, BLOCK_HOST, BLOCK_PATH, TAG.
//   none  — no fault, counts the baseline traffic
//   dns   — BLOCK_HOST (default: the Temple API host) fails DNS → forces the on-chain fallback
//   route — requests whose path starts with BLOCK_PATH are aborted
import { launch, TID, PASSWORD, pollState, readCrashes, crashSummary, result } from './lib.mjs';

const MODE = process.env.MODE ?? 'none';
const BLOCK_HOST = process.env.BLOCK_HOST ?? 'temple-api-mainnet.stage.madfish.xyz';
const BLOCK_PATH = process.env.BLOCK_PATH ?? '/api/evm/balances';
const TAG = process.env.TAG ?? `network-${MODE}`;
const WINDOW_MS = 45000;
const MULTICALL3 = '0xca11bde05977b3631167028862be2a173976ca11';
const log = (...a) => console.log(`[${TAG}]`, ...a);

const subCallCount = data => {
  if (!data || !data.startsWith('0x82ad56cb')) return null;
  const hex = data.slice(10);
  return hex.length < 128 ? null : parseInt(hex.slice(64, 128), 16);
};

const main = async () => {
  const { ctx, page } = await launch({
    extraArgs: MODE === 'dns' ? [`--host-resolver-rules=MAP ${BLOCK_HOST} ~NOTFOUND`] : []
  });
  let matched = 0;
  if (MODE === 'route')
    await ctx.route(
      url => url.pathname.startsWith(BLOCK_PATH),
      route => {
        matched++;
        route.abort('failed');
      }
    );
  await page.waitForSelector(TID('Unlock/Password Input'), { timeout: 60000 });
  await page.fill(TID('Unlock/Password Input'), PASSWORD);

  const httpByHost = {};
  const subCounts = [];
  const subByHost = {};
  const failures = {};
  const paths = {};
  let httpTotal = 0;
  page.on('request', r => {
    const url = r.url();
    if (url.startsWith('chrome-extension:')) return;
    let host;
    try {
      host = new URL(url).host;
    } catch {
      return;
    }
    httpTotal++;
    httpByHost[host] = (httpByHost[host] ?? 0) + 1;
    if (/madfish|templewallet|tzkt|objkt|ipfs|arweave|opensea/.test(host)) {
      let p = '';
      try {
        p = new URL(url).pathname.replace(/0x[0-9a-fA-F]{6,}/, '0x…').slice(0, 60);
      } catch {}
      const k = `${host.split('.').slice(-3).join('.')} ${p}`;
      paths[k] = (paths[k] ?? 0) + 1;
    }
    let body = null;
    try {
      body = r.postData();
    } catch {}
    if (!body) return;
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return;
    }
    for (const m of Array.isArray(parsed) ? parsed : [parsed]) {
      if (m?.method !== 'eth_call' || (m.params?.[0]?.to ?? '').toLowerCase() !== MULTICALL3) continue;
      const n = subCallCount(m.params[0].data);
      if (n == null) continue;
      subCounts.push(n);
      subByHost[host] ??= { requests: 0, subCalls: 0 };
      subByHost[host].requests++;
      subByHost[host].subCalls += n;
    }
  });
  page.on('response', r => {
    if (r.status() < 400) return;
    let h;
    try {
      h = new URL(r.url()).host;
    } catch {
      return;
    }
    const k = `${h.split('.').slice(-3).join('.')} ${r.status()}`;
    failures[k] = (failures[k] ?? 0) + 1;
  });
  page.on('requestfailed', r => {
    let h;
    try {
      h = new URL(r.url()).host;
    } catch {
      return;
    }
    const k = `${h.split('.').slice(-3).join('.')} ${r.failure()?.errorText ?? '?'}`;
    failures[k] = (failures[k] ?? 0) + 1;
  });

  const t0 = Date.now();
  await page.click(TID('Unlock/Unlock Button'));
  const milestones = {};
  const mark = k => {
    milestones[k] ??= Date.now() - t0;
  };
  const timeline = [];
  while (Date.now() - t0 < WINDOW_MS) {
    const s = await pollState(page);
    if (s) {
      if (s.unlocked) mark('unlockScreenGone');
      if (s.balanceRows > 0) mark('firstBalanceRow');
      if (s.skeletons === 0 && s.items > 0) mark('noSkeletons');
    }
    timeline[Math.floor((Date.now() - t0) / 1000)] = httpTotal;
    await page.waitForTimeout(250);
  }

  const sorted = [...subCounts].sort((a, b) => a - b);
  const pct = p => (sorted.length ? sorted[Math.floor((sorted.length - 1) * p)] : null);
  const top = (o, n, by = v => v) =>
    Object.entries(o)
      .sort((a, b) => by(b[1]) - by(a[1]))
      .slice(0, n);
  log(
    'mode                     :',
    MODE,
    MODE === 'dns' ? BLOCK_HOST : MODE === 'route' ? `${BLOCK_PATH} (matched ${matched})` : ''
  );
  log('milestones (ms)          :', JSON.stringify(milestones));
  log('total HTTP               :', httpTotal);
  log('HTTP by host             :', JSON.stringify(top(httpByHost, 10)));
  log(
    'multicall3 requests      :',
    subCounts.length,
    'sub-calls:',
    subCounts.reduce((a, b) => a + b, 0)
  );
  log(
    'sub-calls per request    :',
    JSON.stringify({ min: sorted[0], p50: pct(0.5), p90: pct(0.9), max: sorted[sorted.length - 1] })
  );
  log('multicall by host        :', JSON.stringify(top(subByHost, 8, v => v.requests)));
  log('api/ipfs paths (top)     :', JSON.stringify(top(paths, 10)));
  log('failures                 :', JSON.stringify(top(failures, 10)));
  log(
    'cumulative HTTP per sec  :',
    JSON.stringify(
      timeline.map((v, i) => [i, v]).filter(x => x[1] != null && [1, 2, 3, 4, 5, 8, 12, 20, 30, 44].includes(x[0]))
    )
  );
  const crash = crashSummary(await readCrashes(page));
  log('crashes                  :', crash.line);
  result({
    probe: 'network',
    mode: MODE,
    milestones,
    totalHttp: httpTotal,
    multicall: {
      requests: subCounts.length,
      subCalls: subCounts.reduce((a, b) => a + b, 0),
      p50: pct(0.5),
      p90: pct(0.9),
      max: sorted.at(-1) ?? null
    },
    failures: top(failures, 5),
    crashes: crash.crashes,
    crash: crash.crash
  });
  await ctx.close();
};
main().catch(e => {
  console.error(`[${TAG}] FAILED`, e);
  process.exit(1);
});
