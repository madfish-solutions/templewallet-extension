# Performance check

Compares two versions of the extension on the same test wallet, usually your changes and the code they started from. It tells you which version is faster, and whether anything crashed or flooded the network.

## Before the first run

Once per machine, about 5 minutes:

```bash
cd e2e && yarn && cd ..    # installs the browser the check drives
node perf/setup.mjs        # creates the test wallet "whale"
```

"whale" watches a public address with thousands of tokens and NFTs, so slow spots show up. It uses no real keys.

## Run a comparison

```bash
node perf/compare.mjs base=$(git merge-base HEAD origin/development) mine=.
```

- `base` is the commit your branch started from, and `mine` (`.`) is your current code, uncommitted changes included. The result then shows only what your changes did.
- The names are yours to choose; they become the table's columns. After `=` goes a branch, tag or commit, or `.`.
- Avoid comparing against `origin/development` directly unless your branch is up to date with it. Otherwise the differences include other people's newer commits.
- It takes about 20 minutes per version (build, warm-up, measurements), so 40 minutes or more for the usual two; a slow version takes longer. Chrome windows open and close on their own. Don't use the computer meanwhile, because other work skews the timings. The check keeps the wallet from locking itself (a small pointer move every 30 seconds) and, on macOS, keeps the display awake; on other systems make sure the screen doesn't lock or sleep during the run.

## Reading the result

The result starts with a summary:

```
mine compared with base
- Better: unlock 2.0× faster, tokens page 2.6× faster, requests after unlock 843× fewer, 8 more in the table
- Worse: Requests in 30 s after locking: 17 → 167
- Broken: base: the token list crashes after ~390 rows (URIError: URI malformed)
- Trust: every version measured the same wallet and data
```

- **Better / Worse:** the differences that are real, not noise.
- **Broken:** crashes, a wallet that locked itself in the middle of a measurement, measurements that didn't finish, and a probe that could not find what it measures (then a test id in the app changed; the selectors live in `perf/lib.mjs`). Rows that could not be measured because of it show "n/a" or "not measured" and get no verdict.
- **Trust:** a warning when a version didn't get the same data as the others, usually because a public server rate-limited it. Then the whole comparison is off, not only that version's network numbers: the app retries, and retries cost time and CPU. Better and Worse say "unreliable" in that case. The warm-up already fetches throttled answers again, slowly, so that both versions replay the same data; if the warning still appears, the server kept refusing (its warm-up log says why, for example "the server asks to come back in 22 days", which means a quota, not a rate limit). Wait an hour and run again; several comparisons in a row make it worse.

A table follows, with one row per measurement. Every column after the first says how it compares with the first one: "2.0× faster", "worse", or "same". "Same" means the difference is within normal run-to-run variation.

One row is not repeatable: "Stutters while scrolling the whole list" came out as 0 and then 432 for the same code, 40 minutes apart. Treat that row as a hint, not a verdict.

Then come the details, with every number: timings as median (min–max) over the runs, plus work on the main thread, memory, requests by kind, and how many server answers were replayed, rate-limited or lost.

Everything is saved in `perf/out/cmp-<date-time>/`: `report.md`, each measurement's raw log, the builds, the recorded server answers, and one slow-laptop trace per version (200–400 MB each). To print a finished comparison again, run `node perf/results.mjs perf/out/cmp-<date-time>`.

## What it measures

- Opening and unlocking the wallet, 5 times per version. The first, cold one is not counted.
- The tokens page: how fast it opens, stutter while scrolling, memory, crashes.
- The NFTs page: network requests, pictures loading, crashes, activity after locking.
- Network traffic in the first 45 seconds after unlock.
- Smoothness on a simulated slow laptop.

## The Tezos side

"whale" is an EVM address, so a comparison on it exercises the EVM code paths. For the Tezos paths, create the second test wallet once and compare on it:

```bash
node perf/setup.mjs tezos                        # creates "whale-tezos", about 3 minutes
node perf/compare.mjs --profile whale-tezos base=$(git merge-base HEAD origin/development) mine=.
```

"whale-tezos" watches a public Tezos address with about 2,700 NFTs and a couple of dozen tokens, so the NFTs page is the heavy part there. The rows are the same; in the details, TzKT and objkt answers count as "indexer" requests. To run a single script on it, add `TW_PROFILE_NAME=whale-tezos`.

## Useful options

- `--unlocks 10`: more unlocks, for when the differences are small.
- `RATE=4 node perf/compare.mjs …`: run everything on a 4× slower CPU, closer to a weak laptop. It takes longer.
- `TW_API_CACHE=perf/out/cmp-<date-time>/api-cache node perf/compare.mjs --no-warmup …`: reuse the server answers recorded by an earlier run, so a comparison on another day sees the same token list. Balances, prices and pictures still come live.

## Good to know

- Only compare versions measured in the same run. The test wallet receives new tokens every day, so runs from different days measure different data.
- Rate limiting swings numbers more than any code change. The same commit opened the tokens page in 0.64 s and 0.81 s on healthy runs, but in 7.9 s while an IPFS server was throttling it. A production build sends tens of thousands of requests to public servers per run, so don't run comparisons in a loop: the servers start rate-limiting, and the next run's numbers are off (see Trust above).
- Expect the "unreliable" caveat on every comparison against a `development` commit from before the NFT-page request storm was fixed (TW-2390): that storm always triggers the throttle.
- The wallet locks itself 5 minutes after the page loses focus or after the last mouse or keyboard input. The check moves the pointer a little every 30 seconds to prevent that; if it happens anyway, the report says so under Broken and leaves the affected rows empty instead of measuring the unlock screen.
- Exclude `perf/out` from your IDE's indexing (WebStorm: right-click the folder → Mark Directory as → Excluded; `dist` too). Being git-ignored does not stop the IDE from parsing what is in there, and a few runs leave gigabytes of JSON traces and heap snapshots that make it run out of memory and keep the laptop hot.
- Old runs are never deleted. A comparison leaves about 1 GB per version: the trace and the build in `perf/out/cmp-…/` (not committed), and two copies of the test wallet in the `temple-perf-profiles` folder of your system temp directory. Delete old `cmp-…` folders and profile copies now and then; keep the test wallets (`whale`, `whale-tezos`) and their `-scratch` copies (see below). To open that folder on macOS:

  ```bash
  open "$(node -p 'require("os").tmpdir()')/temple-perf-profiles"
  ```

## For deeper investigation

### "Which code makes it slow?": CPU profile

Use this when a comparison shows something is slow, for example unlock, and you want to know where the CPU time goes.

```bash
node perf/profile.mjs .     # about 2 min: builds your code, records, prints where the time went
```

- It records two moments, unlocking and opening the tokens page. For each it prints the CPU time:
  - by category: extension JavaScript, browser work (style, layout, paint), garbage collection, idle;
  - by bundle file;
  - by function.
- Production builds are minified, so function names are short. Each one comes with its position in the bundle file, and the bundle file tells you which part of the app it is.
- To see the full call tree, drag `perf/out/prof-unlock.cpuprofile` (or `prof-tokens-open.cpuprofile`) into Chrome DevTools' Performance panel.
- To profile another version the same way, run `node perf/profile.mjs origin/development` (or any branch or commit).

### "I only need one number": run a single measurement

Use this when a full half-hour comparison is too much, for example while iterating on unlock speed.

```bash
BUILD=$(perf/build.sh .)                               # build your current code (~40 s)
TW_EXT=$BUILD node perf/unlock.mjs                     # unlock timings only, about 30 s
```

- The other measurements work the same way: `tokens.mjs`, `nfts.mjs`, `network.mjs`, `jank.mjs`. Each file's first lines say what it measures and which settings it takes.
- `soak.mjs` is the long one: it keeps one page open for an hour and, every 6 minutes, opens Tokens, NFTs, Activity and Home and reports how long each takes, memory, storage size and long tasks, so you can see whether the wallet gets slower the longer it stays open (`MINUTES`, `STEP_MIN` and the other settings are in its first lines).
- A single script runs on `whale-scratch` (or `whale-tezos-scratch`), a copy of the test wallet made on the first run, so the wallet itself stays as setup left it for comparisons. The copy keeps what the wallet cached in earlier runs, so numbers drift a little from run to run; delete the folder to start from a cold wallet. That's fine for a quick look; for a fair "before vs after" answer, use `compare.mjs`.
