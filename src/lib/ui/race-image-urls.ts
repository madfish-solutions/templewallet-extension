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
const RATE_LIMIT_BACKOFF_MS = 30_000;
const RATE_LIMITED_STATUS = 429;
const HOST_RESUME_JITTER_MS = 5_000;

const rateLimitedAt = new Map<string, number>();
const hostRateLimitedAt = new Map<string, number>();

const getHost = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const isRateLimitedEntry = (entry: PerformanceEntry | undefined): entry is PerformanceResourceTiming =>
  typeof PerformanceResourceTiming !== 'undefined' &&
  entry instanceof PerformanceResourceTiming &&
  entry.responseStatus === RATE_LIMITED_STATUS;

const watchRateLimitedResponses = () => {
  if (typeof PerformanceObserver === 'undefined' || !PerformanceObserver.supportedEntryTypes?.includes('resource')) {
    return;
  }

  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (!isRateLimitedEntry(entry)) continue;

      const now = Date.now();
      rateLimitedAt.set(entry.name, now);
      hostRateLimitedAt.set(getHost(entry.name), now);
    }
  }).observe({ type: 'resource' });
};

const getBufferedRateLimitTime = (url: string) => {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') return 0;

  const entry = performance.getEntriesByName(url).at(-1);

  return isRateLimitedEntry(entry) ? performance.timeOrigin + entry.responseEnd : 0;
};

const getUrlRateLimitedAt = (url: string) => Math.max(rateLimitedAt.get(url) ?? 0, getBufferedRateLimitTime(url));

const wasRateLimited = (url: string) => Date.now() - getUrlRateLimitedAt(url) < RATE_LIMIT_BACKOFF_MS;

const getHostsQuietAt = (urls: string[]) =>
  Math.max(
    ...urls.map(
      url => Math.max(hostRateLimitedAt.get(getHost(url)) ?? 0, getUrlRateLimitedAt(url)) + RATE_LIMIT_BACKOFF_MS
    )
  );

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
    const firstStageUrls = normalized[0].urls;

    if (!options.immediate && getHostsQuietAt(firstStageUrls) > Date.now()) {
      await this.waitForQuietHosts(firstStageUrls, signal);
    }

    const winner = await this.loadStagesInSlot(normalized, options, signal);
    if (winner) return winner;

    const rateLimitedUrls = normalized.flatMap(({ urls }) => urls).filter(wasRateLimited);
    if (rateLimitedUrls.length === 0) return null;

    await this.waitForQuietHosts(rateLimitedUrls, signal);

    return this.loadStagesInSlot(normalized, options, signal);
  }

  private async loadStagesInSlot(normalized: ImageSourceStage[], options: RaceImageUrlsOptions, signal: AbortSignal) {
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

  private async waitForQuietHosts(urls: string[], signal: AbortSignal) {
    const deadline = Date.now() + RATE_LIMIT_BACKOFF_MS;

    for (
      let quietAt = getHostsQuietAt(urls);
      quietAt > Date.now() && Date.now() < deadline;
      quietAt = getHostsQuietAt(urls)
    ) {
      await delay(Math.min(quietAt, deadline) - Date.now() + Math.random() * HOST_RESUME_JITTER_MS, signal);
    }
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
        if (winner) this.winners.set(key, winner);
      })
      .catch(() => undefined)
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

if (typeof window !== 'undefined') watchRateLimitedResponses();

export const raceImageUrls = (urls: string[], options?: RaceImageUrlsOptions) =>
  defaultRacer.raceImageUrls(urls, options);

export const loadImageSourceStages = (stages: ImageSourceStage[], options?: RaceImageUrlsOptions) =>
  defaultRacer.loadImageSourceStages(stages, options);
