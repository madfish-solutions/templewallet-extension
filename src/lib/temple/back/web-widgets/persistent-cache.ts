import { fetchFromStorage, putToStorage } from 'lib/storage';

const FAILURE_BACKOFF_MS = 30 * 1000;

interface Entry<T> {
  value: T;
  builtAt: number;
}

interface PersistentCacheConfig<T> {
  storageKey: string;
  ttlMs: number;
  fallback: T;
  build: () => Promise<T>;
  isValid?: (value: T) => boolean;
}

export const persistentCache = <T>({ storageKey, ttlMs, fallback, build, isValid }: PersistentCacheConfig<T>) => {
  let memo: Entry<T> | null = null;
  let failureAt = 0;

  const isFresh = (entry: Entry<T>, now: number) => entry.value !== undefined && now - entry.builtAt <= ttlMs;

  return async (): Promise<T> => {
    const now = Date.now();
    if (memo && isFresh(memo, now)) return memo.value;

    if (!memo) {
      const persisted = await fetchFromStorage<Entry<T>>(storageKey).catch(() => null);
      if (persisted && isFresh(persisted, now)) {
        memo = persisted;
        return persisted.value;
      }
    }

    if (now - failureAt < FAILURE_BACKOFF_MS) return memo?.value ?? fallback;

    try {
      const value = await build();
      if (isValid && !isValid(value)) {
        failureAt = now;
        return memo?.value ?? fallback;
      }
      memo = { value, builtAt: now };
      putToStorage(storageKey, memo).catch(() => {});
      return value;
    } catch {
      failureAt = now;
      return memo?.value ?? fallback;
    }
  };
};
