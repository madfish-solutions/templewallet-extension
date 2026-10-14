import browser from 'webextension-polyfill';

import { AD_SELECTORS_REFRESH_ALARM, AD_SELECTORS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

import { refreshCampaignPolicy } from './campaign-policy';
import { importExtensionAdsModule } from './import-extension-ads-module';
import {
  checksumSelectorText,
  SELECTOR_FEEDS,
  SelectorFeedState,
  SelectorRefreshResult,
  SelectorStorage
} from './selector-feeds';
import { migrateAdSelectorStorage } from './selector-migration';
import { compileSelectorStorage } from './selector-snapshot';

const REQUEST_TIMEOUT = 20_000;
const MIN_RETRY = 5 * 60_000;
let transaction: Promise<SelectorRefreshResult> | undefined;

export const downloadSelectorFeed = async (
  url: string,
  state: SelectorFeedState
): Promise<{ response: Response; text: string }> => {
  if (!SELECTOR_FEEDS.some(feed => feed.url === url)) throw new Error('Unapproved selector feed');
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const headers: Record<string, string> = {};
    if (state.etag) headers['If-None-Match'] = state.etag;
    if (state.lastModified) headers['If-Modified-Since'] = state.lastModified;
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      cache: 'no-cache'
    });
    if (response.status === 304 || !response.ok) return { response, text: '' };
    const { SELECTOR_LIMITS } = await importExtensionAdsModule();
    if (Number(response.headers.get('content-length')) > SELECTOR_LIMITS.bytes) throw new Error('Feed byte limit');
    if (!response.body) throw new Error('Missing feed body');
    const reader = response.body.getReader();
    const chunks: string[] = [];
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > SELECTOR_LIMITS.bytes) throw new Error('Feed byte limit');
        chunks.push(decoder.decode(chunk.value, { stream: true }));
      }
    } finally {
      await reader.cancel();
    }
    chunks.push(decoder.decode());
    return { response, text: chunks.join('') };
  } finally {
    clearTimeout(deadline);
  }
};

const retryAfterMs = (response: Response): number => {
  const raw = response.headers.get('retry-after');
  if (!raw) return 0;
  const seconds = Number(raw);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(raw) - Date.now();
  return Number.isFinite(delay) ? Math.min(7 * 24 * 60 * 60_000, Math.max(0, delay)) : 0;
};

const refresh = async (): Promise<SelectorRefreshResult> => {
  if (!(await browser.alarms.get(AD_SELECTORS_REFRESH_ALARM))) {
    await browser.alarms.create(AD_SELECTORS_REFRESH_ALARM, { delayInMinutes: 1, periodInMinutes: 5 });
  }
  const previous = await migrateAdSelectorStorage();
  const feeds = { ...previous.feeds };
  const errors: string[] = [];
  let successes = 0;
  let changed = false;
  for (const feed of SELECTOR_FEEDS) {
    const state: SelectorFeedState = feeds[feed.id] ?? {
      sourceVersion: '',
      lastCheckedAt: 0,
      lastSuccessfulAt: 0,
      nextCheckAt: 0,
      failures: 0,
      checksum: '',
      parsed: { sourceVersion: '', rules: [], pageExceptions: [], unsupported: {} }
    };
    if (!feed.enabled || state.nextCheckAt > Date.now()) continue;
    const now = Date.now();
    let serverDelay = 0;
    try {
      const { response, text } = await downloadSelectorFeed(feed.url, state);
      if (!response.ok && response.status !== 304) {
        serverDelay = retryAfterMs(response);
        throw new Error(`Feed HTTP ${response.status}`);
      }
      if (response.status === 304) {
        feeds[feed.id] = {
          ...state,
          lastCheckedAt: now,
          lastSuccessfulAt: now,
          nextCheckAt: now + feed.refreshMs,
          failures: 0,
          error: undefined
        };
      } else {
        const { parseSelectorFeed } = await importExtensionAdsModule();
        const parsed = parseSelectorFeed(text, feed.id);
        const count = parsed.rules.filter(rule => rule.kind === 'selector').length;
        if (count === 0) throw new Error('Feed contains no selectors');
        const checksum = await checksumSelectorText(text);
        const staged: SelectorFeedState = {
          parsed,
          checksum,
          sourceVersion: parsed.sourceVersion,
          etag: response.headers.get('etag') ?? undefined,
          lastModified: response.headers.get('last-modified') ?? undefined,
          lastCheckedAt: now,
          lastSuccessfulAt: now,
          nextCheckAt: now + feed.refreshMs,
          failures: 0,
          countChange: count - state.parsed.rules.filter(rule => rule.kind === 'selector').length
        };
        await compileSelectorStorage({ ...feeds, [feed.id]: staged });
        feeds[feed.id] = staged;
        changed ||= checksum !== state.checksum;
      }
      successes++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Feed refresh failed';
      const failures = state.failures + 1;
      feeds[feed.id] = {
        ...state,
        failures,
        lastCheckedAt: now,
        error: message,
        nextCheckAt:
          now +
          Math.max(
            serverDelay,
            Math.min(feed.refreshMs, MIN_RETRY * 2 ** Math.min(failures - 1, 10)) * (1 + Math.random() * 0.2)
          )
      };
      errors.push(`${feed.id}: ${message}`);
    }
  }
  const next = await compileSelectorStorage(feeds);
  await browser.storage.local.set({ [AD_SELECTORS_STORAGE_KEY]: next });
  await browser.alarms.create(AD_SELECTORS_REFRESH_ALARM, {
    periodInMinutes: 5,
    when: Math.max(
      Date.now() + 60_000,
      Math.min(
        Date.now() + 5 * 60_000,
        ...SELECTOR_FEEDS.filter(feed => feed.enabled).map(feed => feeds[feed.id].nextCheckAt)
      )
    )
  });
  void refreshCampaignPolicy().catch(error => console.error('Ad campaign policy:', error));
  return {
    status: errors.length ? (successes ? 'partial' : 'failure') : changed ? 'success' : 'unchanged',
    revision: next.snapshot.revision,
    errors
  };
};

export const refreshAdSelectors = (): Promise<SelectorRefreshResult> => {
  if (transaction) return transaction;
  transaction = refresh()
    .catch(async (error: unknown): Promise<SelectorRefreshResult> => {
      const stored = await fetchFromStorage<SelectorStorage>(AD_SELECTORS_STORAGE_KEY).catch(() => null);
      return {
        status: 'failure',
        revision: stored?.snapshot?.revision ?? '',
        errors: [error instanceof Error ? error.message : 'Selector refresh failed']
      };
    })
    .finally(() => {
      transaction = undefined;
    });
  return transaction;
};
