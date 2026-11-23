import { isRateLimitError } from 'lib/apis/rate-limit';
import { waitWithinLimit } from 'lib/utils/wait-within-limit';

import {
  BACKGROUND_RUNS_PER_MINUTE,
  RATE_LIMIT_PAUSE_MS,
  REUSE_WINDOW_MS,
  SETTLE_DELAY_MS,
  WAIT_LIMIT_MS
} from './constants';

export type PreparationResult<T> = { kind: 'prepared'; value: T } | { kind: 'none' } | { kind: 'superseded' };

export type PrepareFn<T> = (signal: AbortSignal) => Promise<T>;

interface Slot<T> {
  key: string;
  value: T;
  preparedAt: number;
}

interface Run<T> {
  key: string;
  controller: AbortController;
  promise: Promise<T | undefined>;
}

const BACKGROUND_WINDOW_MS = 60_000;

export const createSwapPreparation = <T>() => {
  let draftKey: string | null = null;
  let ready = false;
  let prepare: PrepareFn<T> | null = null;
  let isUsable: ((value: T) => boolean) | undefined;
  let slot: Slot<T> | null = null;
  let run: Run<T> | null = null;
  let settledKey: string | null = null;
  let attemptedKey: string | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let pausedUntil = 0;
  let backgroundStarts: number[] = [];

  const startRun = (key: string, prepareFn: PrepareFn<T>): Run<T> => {
    const controller = new AbortController();
    const promise = Promise.resolve()
      .then(() => prepareFn(controller.signal))
      .then(
        value => {
          if (controller.signal.aborted || draftKey !== key) return undefined;
          slot = { key, value, preparedAt: Date.now() };

          return value;
        },
        (error: unknown) => {
          if (isRateLimitError(error)) pausedUntil = Date.now() + RATE_LIMIT_PAUSE_MS;
          if (!controller.signal.aborted) console.warn('Swap preparation failed', error);

          return undefined;
        }
      )
      .finally(() => {
        if (run?.controller === controller) run = null;
      });

    run = { key, controller, promise };

    return run;
  };

  const maybeStartBackground = () => {
    if (!draftKey || !prepare || !ready || settledKey !== draftKey || attemptedKey === draftKey) return;
    if (slot?.key === draftKey || run?.key === draftKey) return;

    const now = Date.now();
    if (now < pausedUntil) return;

    backgroundStarts = backgroundStarts.filter(startedAt => now - startedAt < BACKGROUND_WINDOW_MS);
    if (backgroundStarts.length >= BACKGROUND_RUNS_PER_MINUTE) return;

    backgroundStarts.push(now);
    attemptedKey = draftKey;
    startRun(draftKey, prepare);
  };

  const isUsableValue = (value: T) => isUsable?.(value) ?? true;

  return {
    setPrepare(nextPrepare: PrepareFn<T>, nextIsUsable?: (value: T) => boolean) {
      prepare = nextPrepare;
      isUsable = nextIsUsable;
    },

    setDraftKey(key: string | null) {
      if (key === draftKey) return;

      draftKey = key;
      settledKey = null;
      attemptedKey = null;
      clearTimeout(settleTimer);
      if (slot && slot.key !== key) slot = null;
      if (run && run.key !== key) {
        run.controller.abort();
        run = null;
      }

      if (key) {
        settleTimer = setTimeout(() => {
          settledKey = key;
          maybeStartBackground();
        }, SETTLE_DELAY_MS);
      }
    },

    setReady(value: boolean) {
      ready = value;
      if (value) maybeStartBackground();
    },

    async takePrepared(): Promise<PreparationResult<T>> {
      const key = draftKey;
      if (!key) return { kind: 'none' };

      const taken = slot?.key === key ? slot : null;
      slot = null;
      if (taken && Date.now() - taken.preparedAt < REUSE_WINDOW_MS && isUsableValue(taken.value)) {
        return { kind: 'prepared', value: taken.value };
      }

      if (Date.now() < pausedUntil || !prepare) return { kind: 'none' };

      const current = run?.key === key ? run : startRun(key, prepare);
      attemptedKey = key;

      const value = await waitWithinLimit(current.promise, current.controller, WAIT_LIMIT_MS);
      if (current.controller.signal.aborted && run === current) {
        run = null;
      }

      if (draftKey !== key) return { kind: 'superseded' };

      slot = null;

      return value === undefined || !isUsableValue(value) ? { kind: 'none' } : { kind: 'prepared', value };
    },

    dispose() {
      clearTimeout(settleTimer);
      run?.controller.abort();
      run = null;
      slot = null;
      draftKey = null;
      settledKey = null;
      attemptedKey = null;
    }
  };
};

export type SwapPreparation<T> = ReturnType<typeof createSwapPreparation<T>>;
