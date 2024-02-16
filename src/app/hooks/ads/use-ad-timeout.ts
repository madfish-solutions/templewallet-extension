import { useTimeout } from 'lib/ui/hooks';

export const useAdTimeout = (adIsReady: boolean, onTimeout: () => void, timeMs = 10000) => {
  useTimeout(onTimeout, timeMs, !adIsReady);
};
