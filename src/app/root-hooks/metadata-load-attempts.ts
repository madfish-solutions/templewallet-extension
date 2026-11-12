import { useState } from 'react';

import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

// The metadata API answers `null` for tokens it has not cached yet and fills them in the background,
// so an answered slug is asked again a few times before it counts as having no metadata
const MAX_LOAD_ATTEMPTS = 5;
const RETRY_DELAY_MS = 10_000;

const createMetadataLoadAttempts = (onRetryDue: EmptyFn) => {
  const attempts = new Map<string, number>();
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const getAttempts = (key: string) => attempts.get(key) ?? 0;
  const isDue = (key: string) => getAttempts(key) < MAX_LOAD_ATTEMPTS;

  return {
    isDue,
    track: (keys: string[], load: Promise<unknown>) => {
      keys.forEach(key => attempts.set(key, getAttempts(key) + 1));

      return load
        .catch(error => void console.error(error))
        .then(() => {
          if (keys.some(isDue)) {
            clearTimeout(retryTimer);
            retryTimer = setTimeout(onRetryDue, RETRY_DELAY_MS);
          }
        });
    },
    dispose: () => clearTimeout(retryTimer)
  };
};

export const useMetadataLoadAttempts = () => {
  const [retryTick, setRetryTick] = useState(0);
  const [attempts] = useState(() => createMetadataLoadAttempts(() => setRetryTick(tick => tick + 1)));

  useWillUnmount(() => attempts.dispose());

  return { attempts, retryTick };
};
