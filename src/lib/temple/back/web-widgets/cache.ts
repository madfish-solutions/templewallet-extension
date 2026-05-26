import type { ObjktToken } from './objkt-query';

const TTL_MS = 10 * 60 * 1000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

type ReadResult<T> = { hit: true; value: T } | { hit: false };

const tcoCache = new Map<string, Entry<string | null>>();
const tokenCache = new Map<string, Entry<ObjktToken | null>>();
const thumbnailCache = new Map<string, Entry<string | null>>();

const read = <T>(cache: Map<string, Entry<T>>, key: string): ReadResult<T> => {
  const entry = cache.get(key);
  if (!entry) return { hit: false };
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return { hit: false };
  }
  return { hit: true, value: entry.value };
};

const write = <T>(cache: Map<string, Entry<T>>, key: string, value: T): void => {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
};

export const tokenCacheKey = (contract: string, tokenId: string): string => `${contract}:${tokenId}`;

export const getCachedTco = (tcoUrl: string) => read(tcoCache, tcoUrl);
export const setCachedTco = (tcoUrl: string, resolvedUrl: string | null) => write(tcoCache, tcoUrl, resolvedUrl);

export const getCachedToken = (key: string) => read(tokenCache, key);
export const setCachedToken = (key: string, token: ObjktToken | null) => write(tokenCache, key, token);

export const getCachedThumbnail = (url: string) => read(thumbnailCache, url);
export const setCachedThumbnail = (url: string, dataUrl: string | null) => write(thumbnailCache, url, dataUrl);
