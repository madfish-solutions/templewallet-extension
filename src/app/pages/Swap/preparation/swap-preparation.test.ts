import { BaseError, HttpRequestError } from 'viem';

import { AlchemyRpcError } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';

import {
  BACKGROUND_RUNS_PER_MINUTE,
  RATE_LIMIT_PAUSE_MS,
  REUSE_WINDOW_MS,
  SETTLE_DELAY_MS,
  WAIT_LIMIT_MS
} from './constants';
import { createSwapPreparation, PrepareFn } from './swap-preparation';

const nativeSetImmediate = jest.requireActual<typeof import('timers')>('timers').setImmediate;

const flush = () => new Promise<void>(resolve => nativeSetImmediate(resolve));

const elapse = async (ms: number) => {
  jest.advanceTimersByTime(ms);
  await flush();
};

const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const setup = (impl: PrepareFn<string> = () => Promise.resolve('value'), isUsable?: (value: string) => boolean) => {
  const signals: AbortSignal[] = [];
  const prepare = jest.fn((signal: AbortSignal) => {
    signals.push(signal);

    return impl(signal);
  });
  const preparation = createSwapPreparation<string>();
  preparation.setPrepare(prepare, isUsable);

  return { preparation, prepare, signals };
};

const settle = async (preparation: ReturnType<typeof createSwapPreparation<string>>, key = 'draft') => {
  preparation.setDraftKey(key);
  preparation.setReady(true);
  await elapse(SETTLE_DELAY_MS);
};

describe('createSwapPreparation', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers('modern');
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
    jest.useRealTimers();
  });

  it('starts a background run only after the input settles', async () => {
    const { preparation, prepare } = setup();
    preparation.setDraftKey('draft');
    preparation.setReady(true);

    await elapse(SETTLE_DELAY_MS - 1);
    expect(prepare).not.toHaveBeenCalled();

    await elapse(1);
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('waits for the form to be ready', async () => {
    const { preparation, prepare } = setup();
    preparation.setDraftKey('draft');

    await elapse(SETTLE_DELAY_MS);
    expect(prepare).not.toHaveBeenCalled();

    preparation.setReady(true);
    await flush();
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('restarts the settle delay when the input changes', async () => {
    const { preparation, prepare } = setup();
    preparation.setReady(true);
    preparation.setDraftKey('a');
    await elapse(SETTLE_DELAY_MS - 1);
    preparation.setDraftKey('b');
    await elapse(SETTLE_DELAY_MS - 1);
    expect(prepare).not.toHaveBeenCalled();

    await elapse(1);
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('hands a background result over once', async () => {
    const { preparation, prepare } = setup();
    await settle(preparation);

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'value' });
    expect(prepare).toHaveBeenCalledTimes(1);

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'value' });
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('prepares again when the result is older than the reuse window', async () => {
    let calls = 0;
    const { preparation, prepare } = setup(() => Promise.resolve(`value ${++calls}`));
    await settle(preparation);

    await elapse(REUSE_WINDOW_MS);

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'value 2' });
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('joins a background run that is still in flight', async () => {
    const deferred = createDeferred<string>();
    const { preparation, prepare } = setup(() => deferred.promise);
    await settle(preparation);

    const taken = preparation.takePrepared();
    deferred.resolve('late');

    await expect(taken).resolves.toEqual({ kind: 'prepared', value: 'late' });
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('reports superseded when the input changes during the wait', async () => {
    const deferred = createDeferred<string>();
    const { preparation } = setup(() => deferred.promise);
    await settle(preparation);

    const taken = preparation.takePrepared();
    preparation.setDraftKey('changed');
    deferred.resolve('late');

    await expect(taken).resolves.toEqual({ kind: 'superseded' });
  });

  it('aborts the running preparation and drops its result when the input changes', async () => {
    const deferred = createDeferred<string>();
    const { preparation, signals } = setup(() => deferred.promise);
    await settle(preparation, 'a');

    preparation.setDraftKey('b');
    deferred.resolve('for a');
    await flush();

    expect(signals.at(0)?.aborted).toBe(true);
    preparation.setPrepare(() => Promise.resolve('for b'));
    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'for b' });
  });

  it('gives up after the wait limit', async () => {
    const { preparation, signals } = setup(() => new Promise<string>(() => undefined));
    preparation.setDraftKey('draft');

    const taken = preparation.takePrepared();
    await elapse(WAIT_LIMIT_MS);

    await expect(taken).resolves.toEqual({ kind: 'none' });
    expect(signals.at(0)?.aborted).toBe(true);
  });

  it('starts a fresh run after a timed-out one', async () => {
    let calls = 0;
    const { preparation, prepare } = setup(() =>
      ++calls === 1 ? new Promise<string>(() => undefined) : Promise.resolve('value')
    );
    preparation.setDraftKey('draft');

    const timedOut = preparation.takePrepared();
    await elapse(WAIT_LIMIT_MS);
    await expect(timedOut).resolves.toEqual({ kind: 'none' });

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'value' });
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('reports none and logs when the preparation fails', async () => {
    const { preparation } = setup(() => Promise.reject(new Error('estimate failed')));
    preparation.setDraftKey('draft');

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'none' });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does not log a run aborted by an input change', async () => {
    const { preparation } = setup(
      signal => new Promise<string>((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
    );
    await settle(preparation, 'a');

    preparation.setDraftKey('b');
    await flush();

    expect(warn).not.toHaveBeenCalled();
  });

  it('prepares on demand when the background result is unusable', async () => {
    let calls = 0;
    const { preparation, prepare } = setup(
      () => Promise.resolve(++calls === 1 ? 'stale' : 'fresh'),
      value => value !== 'stale'
    );
    await settle(preparation);

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'fresh' });
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('reports none when the on-demand result is unusable too', async () => {
    const { preparation } = setup(
      () => Promise.resolve('stale'),
      value => value !== 'stale'
    );
    preparation.setDraftKey('draft');

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'none' });
  });

  it.each([
    ['an Alchemy', () => new AlchemyRpcError(429, 'Too many requests')],
    [
      'a wrapped viem',
      () =>
        new BaseError('Estimate failed', { cause: new HttpRequestError({ url: 'https://rpc.example', status: 429 }) })
    ]
  ])('pauses after %s rate limit error', async (_, makeError) => {
    let limited = true;
    const { preparation, prepare } = setup(() => (limited ? Promise.reject(makeError()) : Promise.resolve('value')));
    preparation.setDraftKey('draft');

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'none' });
    limited = false;
    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'none' });
    expect(prepare).toHaveBeenCalledTimes(1);

    await elapse(RATE_LIMIT_PAUSE_MS);
    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'prepared', value: 'value' });
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('caps background runs per minute', async () => {
    const { preparation, prepare } = setup();
    preparation.setReady(true);

    for (let i = 0; i <= BACKGROUND_RUNS_PER_MINUTE; i++) {
      preparation.setDraftKey(`draft ${i}`);
      await elapse(SETTLE_DELAY_MS);
    }
    expect(prepare).toHaveBeenCalledTimes(BACKGROUND_RUNS_PER_MINUTE);

    await elapse(60_000);
    preparation.setDraftKey('later');
    await elapse(SETTLE_DELAY_MS);
    expect(prepare).toHaveBeenCalledTimes(BACKGROUND_RUNS_PER_MINUTE + 1);
  });

  it('does not repeat a failed background run for the same input', async () => {
    const { preparation, prepare } = setup(() => Promise.reject(new Error('estimate failed')));
    await settle(preparation);

    preparation.setReady(false);
    preparation.setReady(true);
    await flush();

    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('reports none without preparing when there is no draft', async () => {
    const { preparation, prepare } = setup();

    await expect(preparation.takePrepared()).resolves.toEqual({ kind: 'none' });
    expect(prepare).not.toHaveBeenCalled();
  });

  it('aborts the running preparation on dispose', async () => {
    const { preparation, signals } = setup(() => new Promise<string>(() => undefined));
    await settle(preparation);

    preparation.dispose();

    expect(signals.at(0)?.aborted).toBe(true);
  });
});
