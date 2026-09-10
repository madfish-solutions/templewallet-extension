import { ImageUrlRacer, loadImageSourceStages, normalizeImageSources, raceImageUrls } from './race-image-urls';

type MockOutcome = { type: 'success' | 'error'; delayMs?: number };

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  complete = false;
  private currentSrc = '';

  get src() {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;
    if (!value) {
      return;
    }

    srcAssignments.push(value);
    const outcome = outcomes.get(value) ?? { type: 'success' as const };
    const delayMs = outcome.delayMs ?? 0;

    setTimeout(() => {
      if (this.currentSrc !== value) {
        return;
      }
      if (outcome.type === 'success') {
        this.complete = true;
        this.onload?.();
      } else {
        this.onerror?.();
      }
    }, delayMs);
  }
}

const outcomes = new Map<string, MockOutcome>();
const srcAssignments: string[] = [];
const originalImage = global.Image;

const nativeSetImmediate = jest.requireActual<typeof import('timers')>('timers').setImmediate;

const flushAsyncWork = () => new Promise<void>(resolve => nativeSetImmediate(resolve));

const elapse = async (ms: number) => {
  await flushAsyncWork();
  jest.advanceTimersByTime(ms);

  // Image loads and acquire() schedule follow-up setTimeout(0) from microtasks.
  // Drain those due timers; leave future ones (timeouts, stage delays) queued.
  for (;;) {
    await flushAsyncWork();
    const pendingBefore = jest.getTimerCount();
    jest.advanceTimersByTime(0);
    if (jest.getTimerCount() !== pendingBefore) {
      continue;
    }

    await flushAsyncWork();
    if (jest.getTimerCount() === pendingBefore) {
      return;
    }
  }
};

describe('race-image-urls', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    outcomes.clear();
    srcAssignments.length = 0;
    global.Image = MockImage as unknown as typeof Image;
  });

  afterEach(() => {
    global.Image = originalImage;
    jest.useRealTimers();
  });

  describe('normalizeImageSources', () => {
    it('turns a flat URL list into one-URL stages', () => {
      expect(normalizeImageSources(['a', '', 'b'])).toEqual([{ urls: ['a'] }, { urls: ['b'] }]);
    });

    it('keeps ImageSourceStage entries and drops empty ones', () => {
      expect(normalizeImageSources([{ urls: ['a', 'b'] }, { urls: [''] }, { urls: ['c'], delayMs: 5_000 }])).toEqual([
        { urls: ['a', 'b'] },
        { urls: ['c'], delayMs: 5_000 }
      ]);
    });
  });

  describe('ImageUrlRacer', () => {
    it('resolves with the first URL that loads', async () => {
      outcomes.set('slow', { type: 'success', delayMs: 40 });
      outcomes.set('fast', { type: 'success', delayMs: 5 });
      const racer = new ImageUrlRacer();
      const resultPromise = racer.raceImageUrls(['slow', 'fast'], { timeoutMs: 200 });

      await elapse(5);

      await expect(resultPromise).resolves.toBe('fast');
    });

    it('returns null when every URL fails', async () => {
      outcomes.set('a', { type: 'error' });
      outcomes.set('b', { type: 'error' });
      const racer = new ImageUrlRacer();
      const resultPromise = racer.raceImageUrls(['a', 'b'], { timeoutMs: 200 });

      await elapse(0);

      await expect(resultPromise).resolves.toBeNull();
    });

    it('times out a hung URL', async () => {
      outcomes.set('hung', { type: 'success', delayMs: 200 });
      const racer = new ImageUrlRacer();
      const resultPromise = racer.raceImageUrls(['hung'], { timeoutMs: 20 });

      await elapse(20);

      await expect(resultPromise).resolves.toBeNull();
    });

    it('reuses a cached winner', async () => {
      outcomes.set('ok', { type: 'success' });
      const racer = new ImageUrlRacer();
      const firstLoad = racer.raceImageUrls(['ok'], { timeoutMs: 200 });

      await elapse(0);
      await firstLoad;
      srcAssignments.length = 0;

      await expect(racer.raceImageUrls(['ok'], { timeoutMs: 200 })).resolves.toBe('ok');
      expect(srcAssignments).toEqual([]);
    });

    it('shares an in-flight race', async () => {
      outcomes.set('shared', { type: 'success', delayMs: 30 });
      const racer = new ImageUrlRacer();
      const first = racer.raceImageUrls(['shared'], { timeoutMs: 200 });
      const second = racer.raceImageUrls(['shared'], { timeoutMs: 200 });

      await elapse(30);

      await expect(Promise.all([first, second])).resolves.toEqual(['shared', 'shared']);
      expect(srcAssignments.filter(url => url === 'shared')).toHaveLength(1);
    });

    it('queues races when the in-flight cap is reached', async () => {
      outcomes.set('first', { type: 'success', delayMs: 40 });
      outcomes.set('second', { type: 'success', delayMs: 5 });
      const racer = new ImageUrlRacer(1);
      const first = racer.raceImageUrls(['first'], { timeoutMs: 200 });
      const second = racer.raceImageUrls(['second'], { timeoutMs: 200 });

      await elapse(10);
      expect(srcAssignments).toEqual(['first']);

      await elapse(30);
      expect(srcAssignments).toEqual(['first', 'second']);

      await elapse(5);
      await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
    });

    it('lets an immediate race skip the queue', async () => {
      outcomes.set('queued', { type: 'success', delayMs: 40 });
      outcomes.set('now', { type: 'success', delayMs: 5 });
      const racer = new ImageUrlRacer(1);
      const queued = racer.raceImageUrls(['queued'], { timeoutMs: 200 });
      const now = racer.raceImageUrls(['now'], { timeoutMs: 200, immediate: true });

      await elapse(0);
      expect(srcAssignments).toEqual(['queued', 'now']);

      await elapse(5);
      await expect(now).resolves.toBe('now');

      await elapse(35);
      await queued;
    });

    it('lets a new subscriber rejoin instead of aborting in-flight work', async () => {
      outcomes.set('slow', { type: 'success', delayMs: 30 });
      const racer = new ImageUrlRacer();
      const controller = new AbortController();
      const first = racer.raceImageUrls(['slow'], { signal: controller.signal, timeoutMs: 200 });

      await elapse(0);
      expect(srcAssignments).toEqual(['slow']);

      controller.abort();
      const second = racer.raceImageUrls(['slow'], { timeoutMs: 200 });

      await elapse(30);
      await expect(second).resolves.toBe('slow');
      await first.catch(() => undefined);
      expect(srcAssignments.filter(url => url === 'slow')).toHaveLength(1);
    });

    it('does not leak the in-flight cap when a queued race is aborted', async () => {
      outcomes.set('first', { type: 'success', delayMs: 40 });
      outcomes.set('queued', { type: 'success', delayMs: 5 });
      outcomes.set('after', { type: 'success' });
      const racer = new ImageUrlRacer(1);
      const controller = new AbortController();
      const first = racer.raceImageUrls(['first'], { timeoutMs: 200 });
      const queued = racer.raceImageUrls(['queued'], { signal: controller.signal, timeoutMs: 200 });

      await elapse(0);
      controller.abort();
      queued.catch(() => undefined);

      await elapse(40);
      await first;

      const after = racer.raceImageUrls(['after'], { timeoutMs: 200 });
      await elapse(0);
      await expect(after).resolves.toBe('after');
    });
  });

  describe('loadImageSourceStages', () => {
    it('does not start a delayed last-resort stage when a primary wins', async () => {
      outcomes.set('primary', { type: 'success', delayMs: 5 });
      outcomes.set('pinata', { type: 'success', delayMs: 5 });
      const racer = new ImageUrlRacer();
      const resultPromise = racer.loadImageSourceStages([{ urls: ['primary'] }, { urls: ['pinata'], delayMs: 40 }], {
        timeoutMs: 200
      });

      await elapse(5);
      await expect(resultPromise).resolves.toBe('primary');

      await elapse(60);
      expect(srcAssignments).toEqual(['primary']);
    });

    it('starts the delayed last-resort stage after the delay when primaries fail', async () => {
      outcomes.set('primary', { type: 'error' });
      outcomes.set('pinata', { type: 'success' });
      const racer = new ImageUrlRacer();
      const resultPromise = racer.loadImageSourceStages([{ urls: ['primary'] }, { urls: ['pinata'], delayMs: 30 }], {
        timeoutMs: 200
      });

      await elapse(0);
      expect(srcAssignments).toEqual(['primary']);

      await elapse(30);
      await expect(resultPromise).resolves.toBe('pinata');
      expect(srcAssignments).toEqual(['primary', 'pinata']);
    });

    it('keeps overlapping last-resort in the same cap slot', async () => {
      outcomes.set('primary', { type: 'error', delayMs: 40 });
      outcomes.set('pinata', { type: 'success', delayMs: 5 });
      outcomes.set('other', { type: 'success', delayMs: 5 });
      const racer = new ImageUrlRacer(1);
      const staged = racer.loadImageSourceStages([{ urls: ['primary'] }, { urls: ['pinata'], delayMs: 20 }], {
        timeoutMs: 200
      });
      const other = racer.raceImageUrls(['other'], { timeoutMs: 200 });

      await elapse(0);
      expect(srcAssignments).toEqual(['primary']);

      await elapse(20);
      expect(srcAssignments).toEqual(['primary', 'pinata']);

      await elapse(5);
      await expect(staged).resolves.toBe('pinata');

      await elapse(5);
      await expect(other).resolves.toBe('other');
    });

    it('rejects an aborted load instead of reporting a missing image', async () => {
      outcomes.set('slow', { type: 'success', delayMs: 30 });
      const racer = new ImageUrlRacer();
      const controller = new AbortController();
      const resultPromise = racer.loadImageSourceStages([{ urls: ['slow'] }], {
        signal: controller.signal,
        timeoutMs: 200
      });
      const expectRejection = expect(resultPromise).rejects.toMatchObject({ name: 'AbortError' });

      await elapse(0);
      controller.abort();
      await elapse(0);
      await expectRejection;
    });
  });

  describe('default helpers', () => {
    it('raceImageUrls and loadImageSourceStages use the shared racer', async () => {
      outcomes.set('one', { type: 'success' });
      const first = raceImageUrls(['one'], { timeoutMs: 200 });

      await elapse(0);
      await expect(first).resolves.toBe('one');
      await expect(loadImageSourceStages([{ urls: ['one'] }], { timeoutMs: 200 })).resolves.toBe('one');
    });
  });
});
