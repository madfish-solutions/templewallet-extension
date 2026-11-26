import { waitWithinLimit } from 'lib/utils/wait-within-limit';

import { WAIT_LIMIT_MS } from './constants';

export const runWithLimit = async <T>(
  run: (signal: AbortSignal) => Promise<T>,
  limitMs = WAIT_LIMIT_MS,
  parentSignal?: AbortSignal
): Promise<T | undefined> => {
  if (parentSignal?.aborted) {
    return undefined;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  parentSignal?.addEventListener('abort', abort, { once: true });

  try {
    return await waitWithinLimit(run(controller.signal), controller, limitMs);
  } catch (error) {
    if (!controller.signal.aborted) console.warn('Preparation failed', error);

    return undefined;
  } finally {
    parentSignal?.removeEventListener('abort', abort);
  }
};
