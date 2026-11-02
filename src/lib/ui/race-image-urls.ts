import { Semaphore } from 'async-mutex';

import { acquireUnlessAborted } from 'lib/utils/acquire-unless-aborted';

export interface ImageSourceStage {
  urls: string[];
  delayMs?: number;
}

interface RaceImageUrlsOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  immediate?: boolean;
}

interface InternalRaceOptions extends RaceImageUrlsOptions {
  /** Skip the in-flight cap; used after an outer load already acquired a slot. */
  skipAcquire?: boolean;
  /** Avoid retrying a dying shared race more than once. */
  skipDyingRetry?: boolean;
}

const IMAGE_LOAD_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_RACES = 5;
const FAILURE_BACKOFF_BASE_MS = 5_000;
const FAILURE_BACKOFF_MAX_MS = 5 * 60_000;

const abortError = () => new DOMException('Aborted', 'AbortError');

const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError') ||
  (error instanceof Error && error.name === 'AbortError');

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw signal.reason instanceof Error ? signal.reason : abortError();
  }
};

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (ms <= 0) {
      resolve();
      return;
    }

    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : abortError());
      return;
    }

    const timeoutId = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);
        reject(signal.reason instanceof Error ? signal.reason : abortError());
      },
      { once: true }
    );
  });

const getRaceKey = (urls: string[]) => Array.from(new Set(urls)).sort().join('\0');

interface InFlightRace {
  promise: Promise<string | null>;
  controller: AbortController;
  subscribers: number;
  abortScheduled: boolean;
  abortTimeoutId?: ReturnType<typeof setTimeout>;
}

export const normalizeImageSources = (sources: Array<string | ImageSourceStage | nullish>): ImageSourceStage[] =>
  sources.reduce<ImageSourceStage[]>((stages, source) => {
    if (!source) return stages;

    if (typeof source === 'string') {
      stages.push({ urls: [source] });

      return stages;
    }

    const urls = source.urls.filter(Boolean);
    if (urls.length > 0) {
      stages.push({ urls, delayMs: source.delayMs });
    }

    return stages;
  }, []);

export const areImageSourceStagesEqual = (a: ImageSourceStage[], b: ImageSourceStage[]) => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every(
    (stage, index) =>
      stage.delayMs === b[index].delayMs &&
      stage.urls.length === b[index].urls.length &&
      stage.urls.every((url, urlIndex) => url === b[index].urls[urlIndex])
  );
};

const loadOneImage = (url: string, timeoutMs: number, signal: AbortSignal) =>
  new Promise<string>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : abortError());
      return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
      cleanup();
      img.src = '';
      reject(new Error('Image load timeout'));
    }, timeoutMs);

    const onAbort = () => {
      cleanup();
      img.src = '';
      reject(signal.reason instanceof Error ? signal.reason : abortError());
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
      signal.removeEventListener('abort', onAbort);
    };

    img.onload = () => {
      cleanup();
      resolve(url);
    };
    img.onerror = () => {
      cleanup();
      img.src = '';
      reject(new Error('Image load error'));
    };

    signal.addEventListener('abort', onAbort);
    img.src = url;
  });

export class ImageUrlRacer {
  private readonly winners = new Map<string, string>();
  private readonly inFlight = new Map<string, InFlightRace>();
  private readonly failures = new Map<string, { until: number; attempts: number }>();
  private readonly slots: Semaphore;

  constructor(
    maxConcurrent = MAX_CONCURRENT_RACES,
    private readonly defaultTimeoutMs = IMAGE_LOAD_TIMEOUT_MS
  ) {
    this.slots = new Semaphore(maxConcurrent);
  }

  async raceImageUrls(urls: string[], options: RaceImageUrlsOptions = {}): Promise<string | null> {
    return this.raceImageUrlsInternal(urls, options);
  }

  async loadImageSourceStages(stages: ImageSourceStage[], options: RaceImageUrlsOptions = {}): Promise<string | null> {
    const normalized = normalizeImageSources(stages);

    if (normalized.length === 0) {
      return null;
    }

    const signal = options.signal ?? new AbortController().signal;

    const [, release] = await acquireUnlessAborted(this.slots, signal, options.immediate ?? false);

    try {
      throwIfAborted(signal);

      for (let index = 0; index < normalized.length;) {
        throwIfAborted(signal);

        const stage = normalized[index];
        const next = normalized[index + 1];
        const innerOptions: InternalRaceOptions & { signal: AbortSignal } = {
          ...options,
          signal,
          skipAcquire: true
        };

        if (next?.delayMs) {
          const winner = await this.raceOverlappingStages(stage, next, innerOptions);
          if (winner) {
            return winner;
          }
          index += 2;
          continue;
        }

        const winner = await this.raceStage(stage, innerOptions);
        if (winner) {
          return winner;
        }
        index += 1;
      }

      return null;
    } finally {
      release();
    }
  }

  clearFailures() {
    this.failures.clear();
  }

  private async raceImageUrlsInternal(urls: string[], options: InternalRaceOptions = {}): Promise<string | null> {
    const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
    if (uniqueUrls.length === 0) {
      return null;
    }

    const { timeoutMs = this.defaultTimeoutMs, signal, immediate = false, skipAcquire = false } = options;
    const key = getRaceKey(uniqueUrls);
    const cached = this.winners.get(key);

    if (cached) {
      return cached;
    }

    throwIfAborted(signal);

    const failure = this.failures.get(key);

    if (!immediate && failure && failure.until > Date.now()) {
      return null;
    }

    const existing = this.inFlight.get(key);

    if (existing && !existing.controller.signal.aborted) {
      try {
        return await this.subscribeToInFlight(existing, signal);
      } catch (error) {
        return this.retryIfDyingRace(error, signal, urls, options);
      }
    }

    const controller = new AbortController();
    const entry: InFlightRace = {
      controller,
      subscribers: 0,
      abortScheduled: false,
      promise: this.runRace(uniqueUrls, { timeoutMs, immediate, skipAcquire, signal: controller.signal })
    };
    this.inFlight.set(key, entry);

    entry.promise
      .then(winner => {
        if (winner) {
          this.winners.set(key, winner);
          this.failures.delete(key);
        } else {
          this.recordFailure(key);
        }
      })
      .catch(error => {
        if (!isAbortError(error)) {
          this.recordFailure(key);
        }
      })
      .finally(() => {
        if (this.inFlight.get(key) === entry) {
          this.inFlight.delete(key);
        }
      });

    try {
      return await this.subscribeToInFlight(entry, signal);
    } catch (error) {
      return this.retryIfDyingRace(error, signal, urls, options);
    }
  }

  private recordFailure(key: string) {
    const attempts = (this.failures.get(key)?.attempts ?? 0) + 1;
    const backoff = Math.min(FAILURE_BACKOFF_BASE_MS * 2 ** (attempts - 1), FAILURE_BACKOFF_MAX_MS);

    this.failures.set(key, { until: Date.now() + backoff, attempts });
  }

  private retryIfDyingRace(
    error: unknown,
    signal: AbortSignal | undefined,
    urls: string[],
    options: InternalRaceOptions
  ) {
    throwIfAborted(signal);

    if (!isAbortError(error) || options.skipDyingRetry) {
      throw error;
    }

    return this.raceImageUrlsInternal(urls, { ...options, skipDyingRetry: true });
  }

  private async raceOverlappingStages(
    current: ImageSourceStage,
    next: ImageSourceStage,
    options: InternalRaceOptions & { signal: AbortSignal }
  ) {
    const controller = new AbortController();
    const { signal } = options;
    const onParentAbort = () => controller.abort(signal.reason instanceof Error ? signal.reason : abortError());
    if (signal.aborted) {
      onParentAbort();
    } else {
      signal.addEventListener('abort', onParentAbort, { once: true });
    }

    const nestedOptions: InternalRaceOptions = { ...options, signal: controller.signal };
    const currentRace = this.raceStage(current, nestedOptions);
    const nextRace = delay(next.delayMs ?? 0, controller.signal).then(() => {
      return this.raceStage({ urls: next.urls }, nestedOptions);
    });

    void currentRace.catch(() => undefined);
    void nextRace.catch(() => undefined);

    const toWinner = (promise: Promise<string | null>) =>
      promise.then(url => {
        if (!url) {
          throw new Error('No image');
        }

        return url;
      });

    try {
      const winner = await Promise.any([toWinner(currentRace), toWinner(nextRace)]);
      controller.abort();

      return winner;
    } catch (error) {
      throwIfAborted(signal);

      if (isAbortError(error)) {
        throw error;
      }

      return null;
    } finally {
      signal.removeEventListener('abort', onParentAbort);
    }
  }

  private async raceStage(stage: ImageSourceStage, options: InternalRaceOptions) {
    const signal = options.signal ?? new AbortController().signal;
    if (stage.delayMs) {
      await delay(stage.delayMs, signal);
    }

    return this.raceImageUrlsInternal(stage.urls, { ...options, signal });
  }

  private scheduleInFlightAbort(entry: InFlightRace, reason: unknown) {
    entry.abortScheduled = true;
    if (entry.abortTimeoutId !== undefined) {
      return;
    }

    entry.abortTimeoutId = setTimeout(() => {
      entry.abortTimeoutId = undefined;
      if (entry.abortScheduled && entry.subscribers <= 0 && !entry.controller.signal.aborted) {
        entry.controller.abort(reason instanceof Error ? reason : abortError());
      }
    }, 0);
  }

  private cancelScheduledAbort(entry: InFlightRace) {
    entry.abortScheduled = false;
    if (entry.abortTimeoutId === undefined) {
      return;
    }

    clearTimeout(entry.abortTimeoutId);
    entry.abortTimeoutId = undefined;
  }

  private async subscribeToInFlight(entry: InFlightRace, signal: AbortSignal | undefined) {
    entry.subscribers += 1;
    this.cancelScheduledAbort(entry);

    const onAbort = () => {
      entry.subscribers -= 1;
      if (entry.subscribers <= 0) {
        this.scheduleInFlightAbort(entry, signal?.reason);
      }
    };

    if (signal?.aborted) {
      onAbort();
      throw signal.reason instanceof Error ? signal.reason : abortError();
    }

    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      return await entry.promise;
    } finally {
      signal?.removeEventListener('abort', onAbort);
      if (!signal?.aborted) {
        entry.subscribers -= 1;
        if (entry.subscribers <= 0) {
          this.scheduleInFlightAbort(entry, undefined);
        }
      }
    }
  }

  private async runRace(
    urls: string[],
    options: Required<Pick<InternalRaceOptions, 'timeoutMs' | 'immediate' | 'signal'>> &
      Pick<InternalRaceOptions, 'skipAcquire'>
  ) {
    const [, release] = await acquireUnlessAborted(
      this.slots,
      options.signal,
      options.skipAcquire || options.immediate
    );

    try {
      throwIfAborted(options.signal);

      if (urls.length === 1) {
        try {
          return await loadOneImage(urls[0], options.timeoutMs, options.signal);
        } catch (error) {
          throwIfAborted(options.signal);

          if (isAbortError(error)) {
            throw error;
          }

          return null;
        }
      }

      const controller = new AbortController();
      const onParentAbort = () =>
        controller.abort(options.signal.reason instanceof Error ? options.signal.reason : abortError());
      if (options.signal.aborted) {
        onParentAbort();
      } else {
        options.signal.addEventListener('abort', onParentAbort, { once: true });
      }

      const attempts = urls.map(url => loadOneImage(url, options.timeoutMs, controller.signal));
      attempts.forEach(attempt => attempt.catch(() => undefined));

      try {
        const winner = await Promise.any(attempts);
        controller.abort();

        return winner;
      } catch (error) {
        throwIfAborted(options.signal);

        if (isAbortError(error)) {
          throw error;
        }

        return null;
      } finally {
        options.signal.removeEventListener('abort', onParentAbort);
      }
    } finally {
      release();
    }
  }
}

const defaultRacer = new ImageUrlRacer();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => defaultRacer.clearFailures());
}

export const raceImageUrls = (urls: string[], options?: RaceImageUrlsOptions) =>
  defaultRacer.raceImageUrls(urls, options);

export const loadImageSourceStages = (stages: ImageSourceStage[], options?: RaceImageUrlsOptions) =>
  defaultRacer.loadImageSourceStages(stages, options);
