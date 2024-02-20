import type { EntrypointsResponse } from '@taquito/rpc';
import debounce from 'debounce';

interface CachedEntrypointsItem {
  key: string;
  entrypoints: EntrypointsResponse;
}

const CACHE_KEY = 'FastRpcClient.cachedEntrypoints';
const CACHE_SIZE = 30;

let CACHE = readCache();

export const getCachedEntrypoints = (key: string): EntrypointsResponse | undefined => {
  const index = CACHE.findIndex(item => item.key === key);
  const item = CACHE[index];

  // Moving used caches to the head of the list
  if (index > 0) {
    CACHE.splice(index, 1);
    CACHE.unshift(item!);

    commitCache();
  }

  return item?.entrypoints;
};

export const setCachedEntrypoints = (key: string, entrypoints: EntrypointsResponse) => {
  const index = CACHE.findIndex(item => item.key === key);

  // Moving used caches to the head of the list
  if (index >= 0) CACHE.splice(index, 1);
  CACHE.unshift({ key, entrypoints });

  commitCache();
};

function readCache(): CachedEntrypointsItem[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : [];
  } catch (error) {
    console.error(error);
  }

  return [];
}

const commitCache = debounce(() => {
  if (typeof localStorage === 'undefined') return;

  CACHE = CACHE.slice(0, CACHE_SIZE * 3);

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(CACHE.slice(0, CACHE_SIZE)));
  } catch (error) {
    console.error(error);
  }
}, 2_000);
