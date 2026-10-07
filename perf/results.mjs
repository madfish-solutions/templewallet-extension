// Turns a comparison folder written by perf/compare.mjs into a report: a summary in plain words, a table where every
// column after the first says how it compares with the first, and a details section with every number.
//   node perf/results.mjs <folder>
// Reads only the probes' `RESULT` lines.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROBES = ['unlock', 'tokens', 'nfts', 'network', 'jank'];

// ---------- loading ----------

const readResults = file => {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  return [...text.matchAll(/^RESULT (.+)$/gm)].flatMap(m => {
    try {
      return [JSON.parse(m[1])];
    } catch {
      return [];
    }
  });
};

/** Everything one version's probes reported: unlock runs in order, one result per other probe, API-cache counters. */
const load = (dir, name) => {
  const data = { name, unlock: [], cache: [] };
  for (const probe of PROBES)
    for (const r of readResults(path.join(dir, `${name}-${probe}.log`))) {
      if (r.probe === 'unlock') data.unlock.push(r);
      else if (r.probe === 'api-cache') data.cache.push(r);
      else data[r.probe] = r;
    }
  data.unfinished = PROBES.filter(probe => (probe === 'unlock' ? !data.unlock.length : !data[probe]));
  if (data.jank && !data.trace) data.unfinished.push('trace report');
  return data;
};

const versionNames = dir => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'builds.json'), 'utf8')).map(b => b.name);
  } catch {
    return fs
      .readdirSync(dir)
      .filter(f => f.endsWith('-unlock.log'))
      .map(f => f.slice(0, -'-unlock.log'.length))
      .sort();
  }
};

// ---------- numbers ----------

const finite = values => (values ?? []).filter(Number.isFinite);
const median = values => {
  const sorted = finite(values).sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  if (!sorted.length) return NaN;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const int = v => (Number.isFinite(v) ? Math.round(v).toLocaleString('en-US') : '—');
const pct = (part, whole) => (whole > 0 ? (100 * part) / whole : NaN);
const time = ms => (!Number.isFinite(ms) ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`);
const times = factor => (factor >= 10 ? Math.round(factor) : factor.toFixed(1));

/** The first unlock on a fresh profile copy does first-session work and is always the slowest: leave it out. */
const unlocks = d => (d.unlock.length >= 3 ? d.unlock.slice(1) : d.unlock);
const sumCache = (d, key) => d.cache.reduce((n, c) => n + (c[key] ?? 0), 0);
const scrollCrashed = d => Boolean(d.tokens?.scroll?.crashed) && !d.tokens.scroll.vanished;
const gridCrashed = d => Boolean(d.nfts?.grid?.crashed) && !d.nfts.grid.vanished;
/**
 * The token list turned into something else while it was being scrolled: the unlock screen (`locked`) or nothing
 * (`vanished`). Logs from before those flags existed have a list that had rows at open and almost none after scrolling.
 */
const listGone = d => {
  const t = d.tokens;
  if (!t?.scroll) return false;
  if (t.scroll.locked || t.scroll.vanished) return true;
  return Boolean(t.atBottom && t.atOpen?.rows > 0 && t.atBottom.rows < t.atOpen.rows / 2);
};
const gridGone = d => Boolean(d.nfts?.grid?.locked || d.nfts?.grid?.vanished);
/** A whole-list number, or nothing when the list was not there to be measured. */
const wholeList = (d, pick) => (scrollCrashed(d) || listGone(d) ? NaN : pick(d));
const goneWhy = s => (s.locked ? 'the wallet locked itself' : s.vanished ? 'the list vanished' : 'the list was gone');
/** When and why, for the summary: `260 s into the probe (focus lost 200 s after the page loaded)`. */
const goneWhen = s => {
  if (!s.after) return '';
  const focus = s.focusLoss?.length ? s.focusLoss.join(', ') : 'the page never lost focus';
  return ` ${int(s.after)} s into the probe (${focus}${s.screen ? `; page showed: ${s.screen}` : ''})`;
};

// ---------- verdicts: { word, tone } with tone 1 better, 0 same, -1 worse ----------

const SAME = { word: 'same', tone: 0 };

/** Repeated timings: "same" when the ranges overlap or the medians differ by less than 10%. */
const compareTimings = (own, base) => {
  const [a, b] = [finite(own), finite(base)];
  if (!a.length || !b.length) return null;
  const overlap = a.length > 1 && b.length > 1 && Math.min(...a) <= Math.max(...b) && Math.max(...a) >= Math.min(...b);
  const factor = median(b) / median(a);
  if (overlap || Math.abs(factor - 1) < 0.1) return SAME;
  return factor > 1
    ? { word: `${times(factor)}× faster`, tone: 1 }
    : { word: `${times(1 / factor)}× slower`, tone: -1 };
};

/** Counts where fewer is better: "same" within 3 or 10%; big gaps are shown as a factor. */
const compareCounts = (own, base, { factors = true } = {}) => {
  if (!Number.isFinite(own) || !Number.isFinite(base)) return null;
  if (Math.abs(own - base) <= Math.max(3, 0.1 * Math.max(own, base))) return SAME;
  const tone = own < base ? 1 : -1;
  const factor = Math.max(own, base) / Math.max(1, Math.min(own, base));
  if (factors && own > 0 && base > 0 && factor >= 2)
    return { word: `${times(factor)}× ${tone > 0 ? 'fewer' : 'more'}`, tone };
  return { word: tone > 0 ? 'better' : 'worse', tone };
};

/** Percentages where lower is better: "same" within 5 points. */
const comparePercent = (own, base) => {
  if (!Number.isFinite(own) || !Number.isFinite(base)) return null;
  if (Math.abs(own - base) < 5) return SAME;
  return own < base ? { word: 'better', tone: 1 } : { word: 'worse', tone: -1 };
};

/** Yes/no outcomes: `ok(d)` true is good. */
const compareOk = (own, base) => {
  if (own === null || base === null) return null;
  if (own === base) return SAME;
  return own ? { word: 'better', tone: 1 } : { word: 'worse', tone: -1 };
};

// ---------- the simple table ----------

const timingRow = (label, pick) => ({
  label,
  show: d => time(median(pick(d))),
  verdict: (d, base) => compareTimings(pick(d), pick(base))
});
const countRow = (label, pick, options) => ({
  label,
  show: d => int(pick(d)),
  verdict: (d, base) => compareCounts(pick(d), pick(base), options)
});
const percentRow = (label, pick) => ({
  label,
  show: d => (Number.isFinite(pick(d)) ? `${Math.round(pick(d))}%` : '—'),
  verdict: (d, base) => comparePercent(pick(d), pick(base))
});
const stutters = frames => (frames?.length ? frames.reduce((n, f) => n + f.over33ms, 0) : NaN);
const picturesShown = d => (d.nfts?.tiles?.inView ? d.nfts.tiles.inViewWithImage / d.nfts.tiles.inView : null);
const spinnerOk = d => (d.trace?.spinnerNotComposited == null ? null : d.trace.spinnerNotComposited === 0);

const GROUPS = [
  [
    'Opening and unlocking',
    [
      timingRow('Open → unlock screen', d => unlocks(d).map(u => u.coldOpenMs)),
      timingRow('Unlock → wallet shown', d => unlocks(d).map(u => u.milestones?.unlockScreenGone)),
      {
        ...timingRow('Unlock → first balance', d => unlocks(d).map(u => u.milestones?.firstBalanceRow)),
        short: 'unlock'
      },
      timingRow('Unlock → total balance', d => unlocks(d).map(u => u.milestones?.equityNonZero))
    ]
  ],
  [
    'Tokens page',
    [
      { ...timingRow('Page opens in', d => (d.tokens?.opens ?? []).map(o => o.ms?.settled)), short: 'tokens page' },
      countRow('Stutters while scrolling the first rows', d => stutters(d.tokens?.framesOpen), { factors: false }),
      {
        label: 'Scrolling the whole list',
        show: d =>
          !d.tokens?.scroll
            ? '—'
            : scrollCrashed(d)
              ? `crashes after ~${int(d.tokens.scroll.items)} rows`
              : listGone(d)
                ? `not measured (${goneWhy(d.tokens.scroll)})`
                : `${int(d.tokens.atBottom?.rows)} rows, no crash`,
        verdict: (d, base) =>
          d.tokens?.scroll && base.tokens?.scroll && !listGone(d) && !listGone(base)
            ? compareOk(!scrollCrashed(d), !scrollCrashed(base))
            : null
      },
      {
        ...countRow(
          'Stutters while scrolling the whole list',
          d => wholeList(d, x => stutters(x.tokens?.framesExpanded)),
          {
            factors: false
          }
        ),
        show: d =>
          scrollCrashed(d) ? 'n/a (crashed)' : listGone(d) ? 'n/a (list gone)' : int(stutters(d.tokens?.framesExpanded))
      },
      {
        label: 'Memory after scrolling the whole list',
        show: d =>
          scrollCrashed(d)
            ? 'n/a (crashed)'
            : listGone(d)
              ? 'n/a (list gone)'
              : Number.isFinite(d.tokens?.atBottom?.heapMB)
                ? `${Math.round(d.tokens.atBottom.heapMB)} MB`
                : '—',
        verdict: (d, base) =>
          compareCounts(
            wholeList(d, x => x.tokens?.atBottom?.heapMB),
            wholeList(base, x => x.tokens?.atBottom?.heapMB),
            { factors: false }
          )
      }
    ]
  ],
  [
    'NFTs page',
    [
      { ...countRow('Requests in the first minute', d => d.nfts?.requests?.total), short: 'NFTs page requests' },
      countRow('Requests that failed (browser out of connections)', d => d.nfts?.socketExhaustion),
      {
        label: 'Pictures shown after a minute',
        show: d => (d.nfts?.tiles ? `${d.nfts.tiles.inViewWithImage} of ${d.nfts.tiles.inView}` : '—'),
        verdict: (d, base) => {
          const [own, ref] = [picturesShown(d), picturesShown(base)];
          if (own === null || ref === null) return null;
          if (Math.abs(own - ref) < 0.1) return SAME;
          return own > ref ? { word: 'better', tone: 1 } : { word: 'worse', tone: -1 };
        }
      },
      {
        label: 'Scrolling the NFT grid',
        show: d =>
          !d.nfts?.grid
            ? '—'
            : gridCrashed(d)
              ? `crashes after ~${int(d.nfts.grid.items)} pictures`
              : gridGone(d)
                ? `not measured (${goneWhy(d.nfts.grid)})`
                : `${int(d.nfts.grid.items)} pictures, no crash`,
        verdict: (d, base) =>
          d.nfts?.grid && base.nfts?.grid && !gridGone(d) && !gridGone(base)
            ? compareOk(!gridCrashed(d), !gridCrashed(base))
            : null
      },
      countRow('Requests in 30 s after locking', d => d.nfts?.afterLock?.total)
    ]
  ],
  [
    'Network',
    [{ ...countRow('Requests in 45 s after unlock', d => d.network?.totalHttp), short: 'requests after unlock' }]
  ],
  [
    'Smoothness on a simulated slow laptop',
    [
      percentRow('Time the app was busy', d => pct(d.trace?.busyMs, d.jank?.windowMs)),
      {
        ...percentRow('Dropped frames', d => pct(d.trace?.frames?.dropped, d.trace?.frames?.total)),
        short: 'dropped frames'
      },
      {
        label: 'Loading spinner runs smoothly',
        show: d => (spinnerOk(d) === null ? '—' : spinnerOk(d) ? 'yes' : 'no'),
        verdict: (d, base) => compareOk(spinnerOk(d), spinnerOk(base))
      }
    ]
  ]
];
const ROWS = GROUPS.flatMap(([, rows]) => rows);

// ---------- summary ----------

/** What a probe looked for and did not find: a test id the app dropped, or a build that never rendered it in time. */
const missingLines = d =>
  [
    ['unlock', [...new Set(d.unlock.flatMap(u => u.missing ?? []))]],
    ['tokens', d.tokens?.missing ?? []],
    ['NFTs', d.nfts?.missing ?? []]
  ]
    .filter(([, missing]) => missing.length)
    .map(
      ([probe, missing]) =>
        `${d.name}: the ${probe} probe found no ${missing.join(', ')}; either this build never rendered them in time or a test id changed (see perf/lib.mjs)`
    );

const broken = versions =>
  versions.flatMap(d => [
    ...missingLines(d),
    ...(scrollCrashed(d)
      ? [`${d.name}: the token list crashes after ~${int(d.tokens.scroll.items)} rows (${d.tokens.crash ?? 'error'})`]
      : []),
    ...(listGone(d)
      ? [
          `${d.name}: ${goneWhy(d.tokens.scroll)}${goneWhen(d.tokens.scroll)} while the token list was being scrolled, so its whole-list rows are missing`
        ]
      : []),
    ...(gridCrashed(d)
      ? [`${d.name}: the NFT grid crashes after ~${int(d.nfts.grid.items)} pictures (${d.nfts.crash ?? 'error'})`]
      : []),
    ...(gridGone(d)
      ? [`${d.name}: ${goneWhy(d.nfts.grid)}${goneWhen(d.nfts.grid)} while the NFT grid was being scrolled`]
      : []),
    ...(d.nfts?.lockedItself && !d.nfts.grid?.locked
      ? [
          `${d.name}: the wallet had locked itself before the NFTs probe could lock it, so "requests after locking" is missing`
        ]
      : []),
    ...[...new Set(d.unlock.filter(u => u.crashes).map(u => u.crash))].map(c => `${d.name}: crash after unlock (${c})`),
    ...(d.unfinished.length ? [`${d.name}: did not finish: ${d.unfinished.join(', ')}`] : [])
  ]);

const trustIssues = versions => {
  const [base, ...rest] = versions;
  const issues = [];
  for (const d of rest) {
    if (d.tokens?.account && base.tokens?.account && d.tokens.account !== base.tokens.account)
      issues.push(`${d.name} measured a different account than ${base.name}`);
    const [s0, s1] = [base.unlock[0]?.storageBytes, d.unlock[0]?.storageBytes];
    if (s0 && s1 && Math.abs(s1 - s0) / s0 > 0.01)
      issues.push(`${d.name} started from different wallet data than ${base.name}`);
    const [r0, r1] = [base.tokens?.atBottom?.rows, d.tokens?.atBottom?.rows];
    if (r0 && r1 && Math.abs(r1 - r0) / r0 > 0.02)
      issues.push(`${d.name} listed ${int(r1)} tokens and ${base.name} ${int(r0)}: they got different data`);
  }
  for (const d of versions) {
    const throttled = sumCache(d, 'throttled');
    if (throttled > 100) {
      const where = topError(d, '429') ?? '';
      const server = where.includes('/ipfs/') ? 'an IPFS server' : where.split('/')[0] || 'a server';
      issues.push(
        `${d.name} was rate-limited by ${server} (${int(throttled)} answers): its numbers are not comparable, since retries cost time and CPU too; run again later`
      );
    }
    if (sumCache(d, 'lost') > 50)
      issues.push(`${d.name}: ${int(sumCache(d, 'lost'))} recorded server answers could not be replayed`);
  }
  return issues;
};

/** The most frequent failing endpoint of one version, optionally only for one HTTP status. */
const topError = (d, status) => {
  const counts = new Map();
  for (const c of d.cache)
    for (const [raw, n] of c.topErrors ?? []) {
      const key = raw.replace(/\/\*.*$/, '/*'); // older logs kept segments after the id: /ipfs/*/13.json
      if (!status || key.startsWith(`${status} `)) counts.set(key, (counts.get(key) ?? 0) + n);
    }
  const [key] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  return key ? key.replace(/^\d{3} /, '') : null;
};

const summary = versions => {
  const [base, ...rest] = versions;
  const issues = trustIssues(versions);
  const lines = [];
  for (const d of rest) {
    const verdicts = ROWS.map(row => ({ row, v: row.verdict(d, base) })).filter(({ v }) => v);
    const better = verdicts.filter(({ v }) => v.tone > 0);
    const highlights = better.filter(({ row }) => row.short).map(({ row, v }) => `${row.short} ${v.word}`);
    const more = better.length - highlights.length;
    const worse = verdicts
      .filter(({ v }) => v.tone < 0)
      .map(({ row }) => `${row.label}: ${row.show(base)} → ${row.show(d)}`);
    const caveat = issues.length ? ' (unreliable, see Trust)' : '';
    lines.push(`**${d.name} compared with ${base.name}**`, '');
    lines.push(
      `- **Better${caveat}:** ${[...highlights, ...(more > 0 ? [`${more} more in the table`] : [])].join(', ') || 'nothing'}`
    );
    lines.push(`- **Worse${caveat}:** ${worse.join('; ') || 'nothing'}`);
  }
  const problems = broken(versions);
  lines.push(`- **Broken:** ${problems.join('; ') || 'nothing crashed, every measurement finished'}`);
  lines.push(`- **Trust:** ${issues.join('; ') || 'every version measured the same wallet and data'}`);
  return lines.join('\n');
};

const simpleTable = versions => {
  const [base] = versions;
  const lines = [`| | ${versions.map(d => d.name).join(' | ')} |`, `|---|${versions.map(() => '---').join('|')}|`];
  for (const [group, rows] of GROUPS) {
    lines.push(`| **${group}** |${versions.map(() => ' ').join('|')}|`);
    for (const row of rows) {
      const cells = versions.map((d, i) => {
        const shown = row.show(d);
        const v = i === 0 ? null : row.verdict(d, base);
        return v && shown !== '—' ? `${shown} · ${v.word}` : shown;
      });
      lines.push(`| ${row.label} | ${cells.join(' | ')} |`);
    }
  }
  return lines.join('\n');
};

// ---------- details (every number, for investigations) ----------

/** `median (min–max)`, with a trailing `~` when the range overlaps the first version's range. */
const spread = (values, baseline) => {
  const own = finite(values);
  if (!own.length) return '—';
  if (own.length === 1) return int(own[0]);
  const [lo, hi] = [Math.min(...own), Math.max(...own)];
  const base = finite(baseline);
  const overlaps = base.length > 0 && lo <= Math.max(...base) && hi >= Math.min(...base);
  return `${int(median(own))} (${int(lo)}–${int(hi)})${overlaps ? ' ~' : ''}`;
};
const unlockSpread = pick => (d, base) => spread(unlocks(d).map(pick), base && unlocks(base).map(pick));
const gestureWork = t => (t?.gesturesExpanded ?? []).map(g => g.TaskDuration);

const DETAILS = [
  ['Account', d => d.tokens?.account ?? '—'],
  [
    'Wallet data before each unlock (MB)',
    d =>
      d.unlock.map(u => (Number.isFinite(u.storageBytes) ? (u.storageBytes / 1e6).toFixed(1) : '?')).join(' → ') || '—'
  ],
  ['Unlock runs used (first dropped)', d => `${unlocks(d).length} of ${d.unlock.length}`],
  ['LiFi token list downloaded in those runs', d => `${unlocks(d).filter(u => u.lifiListFetched).length}`],
  ['Open → unlock screen (ms)', unlockSpread(u => u.coldOpenMs)],
  ['Unlock → wallet shown (ms)', unlockSpread(u => u.milestones?.unlockScreenGone)],
  ['Unlock → first balance (ms)', unlockSpread(u => u.milestones?.firstBalanceRow)],
  ['Unlock → total balance (ms)', unlockSpread(u => u.milestones?.equityNonZero)],
  ['Unlock: main-thread work (ms)', unlockSpread(u => u.cost?.TaskDuration)],
  ['Unlock: script (ms)', unlockSpread(u => u.cost?.ScriptDuration)],
  [
    'Tokens page open (ms)',
    (d, base) =>
      spread(
        (d.tokens?.opens ?? []).map(o => o.ms?.settled),
        base && (base.tokens?.opens ?? []).map(o => o.ms?.settled)
      )
  ],
  [
    'Tokens page open: script (ms)',
    (d, base) =>
      spread(
        (d.tokens?.opens ?? []).map(o => o.cost?.ScriptDuration),
        base && (base.tokens?.opens ?? []).map(o => o.cost?.ScriptDuration)
      )
  ],
  [
    'Token rows after scrolling (reached end?)',
    d =>
      scrollCrashed(d)
        ? `crashed after ~${int(d.tokens.scroll.items)}`
        : listGone(d)
          ? `not measured (${goneWhy(d.tokens.scroll)})`
          : d.tokens?.atBottom
            ? `${int(d.tokens.atBottom.rows)} (${d.tokens.scroll?.reachedEnd ? 'yes' : 'no'})`
            : '—'
  ],
  [
    'After scrolling: documents / DOM nodes / listeners',
    d =>
      d.tokens?.atBottom && !listGone(d)
        ? `${int(d.tokens.atBottom.documents)} / ${int(d.tokens.atBottom.domNodes)} / ${int(d.tokens.atBottom.listeners)}`
        : '—'
  ],
  [
    'Whole list: work per scroll gesture (ms)',
    (d, base) =>
      d.tokens?.atBottom && !listGone(d) ? spread(gestureWork(d.tokens), base && gestureWork(base.tokens)) : '—'
  ],
  [
    'NFTs page requests by kind',
    d =>
      d.nfts
        ? Object.entries(d.nfts.requests.byKind)
            .sort((a, b) => b[1] - a[1])
            .map(([kind, n]) => `${kind} ${int(n)}`)
            .join(', ')
        : '—'
  ],
  [
    '45 s after unlock: multicall requests (calls in them)',
    d => (d.network ? `${int(d.network.multicall.requests)} (${int(d.network.multicall.subCalls)})` : '—')
  ],
  [
    'Trace: tasks ≥ 50 ms / ≥ 500 ms (s)',
    d =>
      d.trace
        ? `${d.trace.long50.n} (${(d.trace.long50.ms / 1000).toFixed(1)}) / ${d.trace.long500.n} (${(d.trace.long500.ms / 1000).toFixed(1)})`
        : '—'
  ],
  [
    'Trace: spinner animations not composited',
    d => (d.trace ? String(d.trace.spinnerNotComposited ?? 'no spinner seen') : '—')
  ],
  ['API answers replayed / fetched live', d => `${int(sumCache(d, 'hits'))} / ${int(sumCache(d, 'recorded'))}`],
  [
    'API answers rate-limited / other errors / lost',
    d => `${int(sumCache(d, 'throttled'))} / ${int(sumCache(d, 'httpErrors'))} / ${int(sumCache(d, 'lost'))}`
  ],
  ['Most frequent failing endpoint', d => topError(d) ?? 'none']
];

const detailsTable = versions => {
  const [base] = versions;
  return [
    '## Details',
    '',
    'Every number behind the table. Timings are median (min–max); `~` means the range overlaps the first version’s.',
    '',
    `| | ${versions.map(d => d.name).join(' | ')} |`,
    `|---|${versions.map(() => '---').join('|')}|`,
    ...DETAILS.map(
      ([label, cell]) => `| ${label} | ${versions.map((d, i) => cell(d, i ? base : undefined)).join(' | ')} |`
    )
  ].join('\n');
};

// ---------- report ----------

export const renderReport = dir => {
  const versions = versionNames(dir).map(name => load(dir, name));
  const simple = [
    `## ${versions.map(d => d.name).join(' vs ')}`,
    '',
    summary(versions),
    '',
    simpleTable(versions),
    '',
    '"same" means the difference is within normal run-to-run variation.'
  ].join('\n');
  return { simple, details: detailsTable(versions) };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node perf/results.mjs <comparison folder>');
    process.exit(2);
  }
  const { simple, details } = renderReport(path.resolve(dir));
  console.log(`${simple}\n\n${details}`);
}
