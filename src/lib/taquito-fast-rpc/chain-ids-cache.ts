import debounce from 'debounce';

import { ONE_HOUR_MS } from 'lib/utils/numbers';

interface CachedChainID {
  value: string;
  /** timestamp */
  ts: number;
}

const CACHE_KEY = 'FastRpcClient.cachedChainIDs';

/** 3 hours */
const VALUE_TTL = 3 * ONE_HOUR_MS;

const CACHE = readCache();

export const makeCachedChainIdKey = (rpcUrl: string, chain: string) => `${rpcUrl}/${chain}`;

export const getCachedChainId = (key: string): string | null => {
  const cached = CACHE[key];
  if (!cached) return null;

  // Not using expired value
  if (isExpired(cached.ts)) {
    delete CACHE[key];
    commitCache();

    return null;
  }

  return cached.value;
};

export const setCachedChainId = (key: string, value: string) => {
  if (key.includes('://localhost') || key.includes('://127.0.0.1')) return;

  // Cleaning expired values
  const now = Date.now();
  for (const [key, cached] of Object.entries(CACHE)) {
    if (isExpired(cached.ts, now)) delete CACHE[key];
  }

  // Setting value
  CACHE[key] = { value, ts: now };

  commitCache();
};

function readCache(): StringRecord<CachedChainID> {
  if (typeof localStorage === 'undefined') return {};

  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (err) {
    console.error(err);
  }

  return {};
}

const commitCache = debounce(() => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(CACHE));
  } catch (err) {
    console.error(err);
  }
}, 2_000);

const isExpired = (ts: number, now = Date.now()) => ts + VALUE_TTL < now;
