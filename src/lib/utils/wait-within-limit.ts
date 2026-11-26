import { noop } from 'lodash';

export const waitWithinLimit = async <T>(
  promise: Promise<T>,
  controller: AbortController,
  limitMs: number
): Promise<T | undefined> => {
  const { signal } = controller;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stop: EmptyFn = noop;
  const stopped = new Promise<undefined>(resolve => {
    stop = () => resolve(undefined);
  });

  if (signal.aborted) {
    stop();
  } else {
    signal.addEventListener('abort', stop, { once: true });
    timer = setTimeout(() => controller.abort(), limitMs);
  }

  try {
    return await Promise.race([promise, stopped]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', stop);
  }
};
