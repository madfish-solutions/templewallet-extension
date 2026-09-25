// Where does the CPU time go? Records CPU profiles of (1) unlock click → first balance row and (2) Home → tokens page
// open, then prints each one summarized by category, bundle file and function:
//   node perf/profile.mjs .                   your current code (built first)
//   node perf/profile.mjs <branch | commit>   any version (built first)
//   node perf/profile.mjs <build folder>      an existing build
//   node perf/profile.mjs                     the build in TW_EXT (default dist/chrome_unpacked)
// Production builds are minified and have no source maps, so function names are short; each comes with its position
// in the bundle file. The recordings are saved as perf/out/prof-unlock.cpuprofile and perf/out/prof-tokens-open.cpuprofile
// (OUT_PREFIX changes the prefix); `node perf/analyze-profile.mjs <file>` summarizes one again, and Chrome DevTools opens
// them with the full call tree.
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const log = (...a) => console.log('[prof]', ...a);

// Build first when asked for a version: lib.mjs reads TW_EXT when it loads.
const source = process.argv[2];
if (source && fs.existsSync(path.join(path.resolve(source), 'manifest.json')))
  process.env.TW_EXT = path.resolve(source);
else if (source) {
  log(`building ${source} (about 40 s)…`);
  const build = spawnSync('sh', [path.join(HERE, 'build.sh'), source], { encoding: 'utf8' });
  if (build.status !== 0) {
    console.error(`[prof] could not build ${source}:\n${build.stderr.split('\n').slice(-15).join('\n')}`);
    process.exit(1);
  }
  process.env.TW_EXT = build.stdout.trim();
}

const { launch, TID, PASSWORD, pollState, dismissModals, OUT_DIR, EXT } = await import('./lib.mjs');
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT = process.env.OUT_PREFIX ?? path.join(OUT_DIR, 'prof');

async function pollUntil(page, pred, maxMs, extraMs = 500) {
  const t0 = Date.now();
  let hit = null;
  while (Date.now() - t0 < maxMs) {
    const s = await pollState(page);
    if (s && pred(s)) {
      hit = Date.now() - t0;
      break;
    }
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(extraMs);
  return hit;
}

const main = async () => {
  log('build:', EXT);
  const { ctx, page } = await launch();
  await page.waitForSelector(TID('Unlock/Password Input'), { timeout: 60000 });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 250 });

  await page.fill(TID('Unlock/Password Input'), PASSWORD);
  await cdp.send('Profiler.start');
  await page.click(TID('Unlock/Unlock Button'));
  const firstRow = await pollUntil(page, s => s.balanceRows > 0, 20000, 400);
  const { profile: p1 } = await cdp.send('Profiler.stop');
  fs.writeFileSync(`${OUT}-unlock.cpuprofile`, JSON.stringify(p1));
  log(
    'unlock profile: firstBalanceRow at',
    firstRow,
    'ms; samples=',
    p1.samples.length,
    'span=',
    ((p1.endTime - p1.startTime) / 1000).toFixed(0),
    'ms'
  );

  await page.waitForTimeout(8000);
  await dismissModals(page);
  await page.evaluate(() => {
    location.hash = '#/';
  });
  await page.waitForTimeout(3000);
  await cdp.send('Profiler.start');
  await page.evaluate(() => {
    location.hash = '#/tokens';
  });
  const settled = await pollUntil(page, s => s.items >= 20 && s.balanceRows >= 20, 15000, 1500);
  const { profile: p2 } = await cdp.send('Profiler.stop');
  fs.writeFileSync(`${OUT}-tokens-open.cpuprofile`, JSON.stringify(p2));
  log(
    'tokens-open profile: settled at',
    settled,
    'ms; samples=',
    p2.samples.length,
    'span=',
    ((p2.endTime - p2.startTime) / 1000).toFixed(0),
    'ms'
  );
  await ctx.close();

  for (const file of [`${OUT}-unlock.cpuprofile`, `${OUT}-tokens-open.cpuprofile`]) {
    console.log(`\n# ${path.relative(process.cwd(), file)}`);
    spawnSync(process.execPath, [path.join(HERE, 'analyze-profile.mjs'), file], {
      stdio: 'inherit',
      env: { ...process.env, TW_EXT: EXT }
    });
  }
};
main().catch(e => {
  console.error('[prof] FAILED', e);
  process.exit(1);
});
