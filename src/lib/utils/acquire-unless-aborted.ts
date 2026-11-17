import { Semaphore, SemaphoreInterface } from 'async-mutex';
import { noop } from 'lodash';

type AcquiredSlot = [number, SemaphoreInterface.Releaser];

const getAbortReason = (signal: AbortSignal) =>
  signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError');

export const acquireUnlessAborted = (
  semaphore: Semaphore,
  signal: AbortSignal,
  skipQueue = false
): Promise<AcquiredSlot> => {
  if (signal.aborted) return Promise.reject(getAbortReason(signal));

  if (skipQueue) return Promise.resolve<AcquiredSlot>([semaphore.getValue(), noop]);

  if (!semaphore.isLocked()) return semaphore.acquire();

  return new Promise<AcquiredSlot>((resolve, reject) => {
    const acquired = semaphore.acquire();
    const onAbort = () => {
      void acquired.then(([, release]) => release());
      reject(getAbortReason(signal));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    void acquired.then(slot => {
      signal.removeEventListener('abort', onAbort);
      resolve(slot);
    });
  });
};
