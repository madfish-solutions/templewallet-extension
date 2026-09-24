// Compares versions of the extension on the same test wallet and prints which is faster and whether anything broke:
//   node perf/compare.mjs base=$(git merge-base HEAD origin/development) mine=.
// Each `name=version` is a label you choose and a branch, tag, commit, `.` (your working tree) or a folder with a built
// extension. Versions are built with perf/build.sh when needed. Every version gets a fresh copy of the test wallet
// profile and a warm-up that records the wallet-API answers (fetching throttled ones again, slowly), so all versions
// replay the same data. Then, per version: N unlocks, the tokens page, the NFTs page, the network after unlock and a
// slow-laptop trace.
// Options: --unlocks N (5), --profile NAME (whale), --no-warmup, --out DIR. Env: RATE (CPU throttling), TW_API_CACHE.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderReport } from './results.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILES = path.join(os.tmpdir(), 'temple-perf-profiles');
const PROBE_TIMEOUT_MS = 20 * 60_000;
const USAGE = `usage: node perf/compare.mjs <name>=<branch | commit | . | build folder> [<name>=… ...]
       [--unlocks N] [--profile NAME] [--no-warmup] [--out DIR]
example: node perf/compare.mjs base=$(git merge-base HEAD origin/development) mine=.`;

const fail = message => {
  console.error(message);
  process.exit(2);
};

const parseArgs = argv => {
  const options = { versions: [], unlocks: 5, profile: 'whale', warmup: true, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--unlocks') options.unlocks = Number(argv[++i]);
    else if (arg === '--profile') options.profile = argv[++i];
    else if (arg === '--no-warmup') options.warmup = false;
    else if (arg === '--out') options.out = argv[++i];
    else if (/^[\w.-]+=$/.test(arg))
      fail(`${arg} has nothing after "=". If it came from $(git …), that command failed: check the branch name.`);
    else if (/^[\w.-]+=.+/.test(arg)) {
      const at = arg.indexOf('=');
      options.versions.push({ name: arg.slice(0, at), source: arg.slice(at + 1) });
    } else fail(`unexpected argument: ${arg}\n${USAGE}`);
  }
  if (!options.versions.length) fail(USAGE);
  return options;
};

const pad = n => String(n).padStart(2, '0');
const stamp = (d = new Date()) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const clock = () => new Date().toTimeString().slice(0, 8);

/** A folder with a built extension is used as is; anything else is a git ref (or `.`) built by build.sh. */
const resolveBuild = ({ name, source }, dir) => {
  if (fs.existsSync(path.join(path.resolve(source), 'manifest.json'))) return path.resolve(source);
  const target = path.join(dir, 'builds', name);
  console.log(`${clock()} ${name}: building ${source}`);
  const build = spawnSync('sh', [path.join(HERE, 'build.sh'), source, target], { encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, `${name}-build.log`), `${build.stdout ?? ''}${build.stderr ?? ''}`);
  if (build.status !== 0) fail(`${name}: could not build ${source}; see ${path.join(dir, `${name}-build.log`)}`);
  return target;
};

/** A fresh copy of the profile for one version, used as it is; nothing is ever deleted, old copies stay in PROFILES. */
const copyProfile = (profile, name) => {
  const target = path.join(PROFILES, name);
  if (fs.existsSync(target)) fail(`${target} already exists`);
  const copy = spawnSync('cp', ['-R', path.join(PROFILES, profile), target], { encoding: 'utf8' });
  if (copy.status !== 0) fail(`could not copy the profile to ${target}: ${copy.stderr}`);
  return target;
};

const runProbe = (probe, env, log) => {
  const run = spawnSync(process.execPath, [path.join(HERE, `${probe}.mjs`)], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    timeout: PROBE_TIMEOUT_MS
  });
  fs.appendFileSync(log, `${run.stdout ?? ''}${run.stderr ?? ''}`);
  if (run.status !== 0) console.log(`  ${probe} did not finish (${run.error?.message ?? `exit ${run.status}`})`);
};

const { versions, unlocks, profile, warmup, out } = parseArgs(process.argv.slice(2));
if (!fs.existsSync(path.join(PROFILES, profile)))
  fail(`No test wallet "${profile}" yet: run \`node perf/setup.mjs\` once (it takes about 2 minutes).`);

const run = stamp();
const dir = path.resolve(out ?? path.join(HERE, 'out', `cmp-${run}`));
const cache = process.env.TW_API_CACHE || path.join(dir, 'api-cache');
fs.mkdirSync(path.join(dir, 'warmup'), { recursive: true });
console.log(`Comparing ${versions.map(v => v.name).join(' vs ')}. Leave the computer alone until it finishes.`);
console.log(`Everything is saved in ${path.relative(process.cwd(), dir) || dir}`);

for (const version of versions) version.dir = resolveBuild(version, dir);
fs.writeFileSync(path.join(dir, 'builds.json'), JSON.stringify(versions, null, 2));

if (warmup)
  for (const { name, dir: build } of versions) {
    const env = {
      TW_EXT: build,
      TW_PROFILE: copyProfile(profile, `cmp-${run}-${name}-warmup`),
      TW_API_CACHE: cache,
      TW_API_CACHE_FILL: '1'
    };
    const log = probe => path.join(dir, 'warmup', `${name}-${probe}.log`);
    console.log(`${clock()} ${name}: warm-up (records the server answers)`);
    runProbe('unlock', { ...env, TAG: `warmup-${name}` }, log('unlock'));
    runProbe('tokens', { ...env, TAG: `warmup-${name}`, OPENS: '1', GESTURES: '1' }, log('tokens'));
    // The same minute on the NFTs page and the same scroll as the measured probe, so its answers are recorded too.
    runProbe('nfts', { ...env, TAG: `warmup-${name}`, LOCKED_WINDOW_MS: '0' }, log('nfts'));
  }

for (const { name, dir: build } of versions) {
  const env = { TW_EXT: build, TW_PROFILE: copyProfile(profile, `cmp-${run}-${name}`), TW_API_CACHE: cache };
  const log = probe => path.join(dir, `${name}-${probe}.log`);
  for (let i = 1; i <= unlocks; i++) {
    console.log(`${clock()} ${name}: unlock ${i} of ${unlocks}`);
    runProbe('unlock', { ...env, TAG: `${name}-unlock-${i}` }, log('unlock'));
  }
  for (const [probe, extra] of [
    ['tokens', {}],
    ['nfts', {}],
    ['network', { MODE: 'none' }],
    ['jank', { TRACE_FILE: path.join(dir, `${name}-trace.json`) }]
  ]) {
    console.log(`${clock()} ${name}: ${probe}`);
    runProbe(probe, { ...env, TAG: `${name}-${probe}`, ...extra }, log(probe));
  }
}

const { simple, details } = renderReport(dir);
fs.writeFileSync(path.join(dir, 'report.md'), `${simple}\n\n${details}\n`);
console.log(`\n${simple}\n\n${details}\n\nSaved as ${path.join(dir, 'report.md')}`);
