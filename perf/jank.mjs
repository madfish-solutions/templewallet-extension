// Records a trace of the fullpage app under the two conditions behind the Ryzen findings — device scale factor
// 1.25 (an SVG transform animation cannot composite when effective zoom != 1) and 4x CPU throttling — while a
// synthetic pointer moves at ~60 Hz (drives lock.ts), the wallet unlocks (loaders, sorting, persistence) and the
// token list scrolls. Then prints perf/trace/report.mjs on the result.
// Env: TAG, DSF (default 1.25), RATE (default 4), WINDOW_MS (default 20000), TRACE_FILE (default
// perf/out/jank-<TAG>.json), TW_EXT, TW_PROFILE_NAME.
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

import {
  launch,
  TID,
  ROOT,
  unlockIfNeeded,
  dismissModals,
  setScroll,
  readCrashes,
  crashSummary,
  result
} from './lib.mjs';

const TAG = process.env.TAG ?? 'jank';
const DSF = process.env.DSF ?? '1.25';
const RATE = +(process.env.RATE ?? 4);
const WINDOW_MS = +(process.env.WINDOW_MS ?? 20000);
const CATEGORIES = [
  'toplevel',
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-v8.cpu_profiler',
  'blink.animations',
  'cc',
  'benchmark',
  'v8.execute',
  '__metadata'
];

const main = async () => {
  const { ctx, page } = await launch({ extraArgs: [`--force-device-scale-factor=${DSF}`] });
  await page.waitForSelector(TID('Unlock/Password Input'), { timeout: 60000 });
  const cdp = await ctx.newCDPSession(page);
  if (RATE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });

  const out = process.env.TRACE_FILE ?? path.join(ROOT, 'perf', 'out', `jank-${TAG}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ws = fs.createWriteStream(out);
  ws.write('{"metadata":{"source":"perf/jank.mjs"},\n"traceEvents":[\n');
  let first = true;
  let writes = Promise.resolve();
  cdp.on('Tracing.dataCollected', ({ value }) => {
    writes = writes.then(async () => {
      for (const e of value) {
        if (!ws.write((first ? '' : ',\n') + JSON.stringify(e))) await once(ws, 'drain');
        first = false;
      }
    });
  });
  const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.start', {
    traceConfig: { includedCategories: CATEGORIES, recordMode: 'recordContinuously' },
    transferMode: 'ReportEvents'
  });
  const t0 = Date.now();

  let moving = true;
  const pointer = (async () => {
    for (let i = 0; moving; i++) {
      await page.mouse.move(200 + (i % 50) * 4, 300 + ((i * 7) % 60)).catch(() => {});
      await page.waitForTimeout(16);
    }
  })();

  await unlockIfNeeded(page);
  await page.waitForTimeout(4000);
  await dismissModals(page);
  for (let top = 0; top <= 3200 && Date.now() - t0 < WINDOW_MS - 2000; top += 400) {
    await setScroll(page, top);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(Math.max(0, WINDOW_MS - (Date.now() - t0)));
  moving = false;
  await pointer;
  const crash = crashSummary(await readCrashes(page));

  await cdp.send('Tracing.end');
  await complete;
  await writes;
  await new Promise(resolve => ws.end('\n]}\n', resolve));
  const windowMs = Date.now() - t0;
  console.log(`[${TAG}] trace=${out} window=${windowMs}ms dsf=${DSF} rate=${RATE}`);
  console.log(`[${TAG}] crashes: ${crash.line}`);
  result({ probe: 'jank', trace: out, windowMs, dsf: +DSF, rate: RATE, crashes: crash.crashes, crash: crash.crash });
  await ctx.close();

  const r = spawnSync(
    process.execPath,
    ['--max-old-space-size=8192', path.join(ROOT, 'perf', 'trace', 'report.mjs'), out],
    { stdio: 'inherit' }
  );
  process.exit(r.status ?? 1);
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
