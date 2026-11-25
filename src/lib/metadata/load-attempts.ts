import { useEffect, useState } from 'react';

import { TOKENS_METADATA_MEMO_MAX_AGE } from 'lib/apis/temple';

// The metadata API answers `null` for tokens it has not cached yet and fills them in the background,
// so an answered slug is asked again a few times before it counts as having no metadata
const MAX_LOAD_ATTEMPTS = 5;
const RETRY_DELAY_MS = TOKENS_METADATA_MEMO_MAX_AGE + 1_000;

const createMetadataLoadAttempts = (maxAttempts: number, onRetryDue: EmptyFn) => {
  const counts = new Map<string, number>();
  const cooling = new Set<string>();
  let unsettledKeys: string[] = [];
  let settledKeys: string[] = [];
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;

  const hasAttemptsLeft = (key: string) => (counts.get(key) ?? 0) < maxAttempts;

  const scheduleRelease = () => {
    clearTimeout(releaseTimer);

    if (paused || !settledKeys.length) return;

    releaseTimer = setTimeout(() => {
      settledKeys.forEach(key => cooling.delete(key));
      settledKeys = [];
      onRetryDue();
    }, RETRY_DELAY_MS);
  };

  const markSettled = (keys: string[]) => {
    if (!keys.length) return;

    settledKeys = settledKeys.concat(keys);
    scheduleRelease();
  };

  return {
    isDue: (key: string) => hasAttemptsLeft(key) && !cooling.has(key),
    track: async (keys: string[], load?: Promise<unknown>) => {
      keys.forEach(key => counts.set(key, (counts.get(key) ?? 0) + 1));

      const retriableKeys = keys.filter(hasAttemptsLeft);
      retriableKeys.forEach(key => cooling.add(key));

      if (!load) {
        unsettledKeys = unsettledKeys.concat(retriableKeys);

        return;
      }

      await load.catch(error => void console.error(error));
      markSettled(retriableKeys);
    },
    settle: () => {
      markSettled(unsettledKeys);
      unsettledKeys = [];
    },
    resume: () => {
      paused = false;
      scheduleRelease();
    },
    pause: () => {
      paused = true;
      clearTimeout(releaseTimer);
    }
  };
};

export const useMetadataLoadAttempts = (withRetries = true) => {
  const [retryTick, setRetryTick] = useState(0);
  const [attempts] = useState(() =>
    createMetadataLoadAttempts(withRetries ? MAX_LOAD_ATTEMPTS : 1, () => setRetryTick(tick => tick + 1))
  );

  useEffect(() => {
    attempts.resume();

    return () => attempts.pause();
  }, [attempts]);

  return { attempts, retryTick };
};
