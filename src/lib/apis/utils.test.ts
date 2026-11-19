import { AxiosError, AxiosHeaders } from 'axios';

import { isAbortError, retryDelayMsFromHeaderValue, shareInFlight, withRateLimitRetry } from './utils';

const tooManyRequests = (retryAfter: string) =>
  new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, null, {
    data: {},
    status: 429,
    statusText: 'Too Many Requests',
    headers: new AxiosHeaders({ 'retry-after': retryAfter }),
    config: { headers: new AxiosHeaders() }
  });

describe('retryDelayMsFromHeaderValue', () => {
  const now = Date.parse('2026-10-22T12:00:00.000Z');

  it('reads a delay in seconds', () => {
    expect(retryDelayMsFromHeaderValue('2', now)).toBe(2000);
    expect(retryDelayMsFromHeaderValue(3, now)).toBe(3000);
  });

  it('reads an HTTP date', () => {
    expect(retryDelayMsFromHeaderValue('Thu, 22 Oct 2026 12:00:05 GMT', now)).toBe(5000);
  });

  it('uses one second when the header is missing', () => {
    expect(retryDelayMsFromHeaderValue(undefined, now)).toBe(1000);
  });
});

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('withRateLimitRetry', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => jest.useRealTimers());

  it('waits for Retry-After and tries the request again', async () => {
    const run = jest.fn().mockRejectedValueOnce(tooManyRequests('2')).mockResolvedValueOnce('ok');
    const pending = withRateLimitRetry(run, new AbortController().signal);

    await flushMicrotasks();
    expect(run).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1999);
    await flushMicrotasks();
    expect(run).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await expect(pending).resolves.toBe('ok');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('stops waiting when the signal aborts', async () => {
    const run = jest.fn().mockRejectedValue(tooManyRequests('5'));
    const controller = new AbortController();
    const pending = withRateLimitRetry(run, controller.signal);

    await flushMicrotasks();
    controller.abort(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(
      pending.then(
        () => 'resolved',
        () => 'rejected'
      )
    ).resolves.toBe('rejected');
    jest.advanceTimersByTime(5000);
    await flushMicrotasks();
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('shareInFlight', () => {
  it('runs once while the first call is in flight, then again after it settles', async () => {
    const bucket = new Map<string, Promise<string>>();
    const run = jest.fn(() => Promise.resolve('ok'));

    const first = shareInFlight(bucket, 'wallet:137', run);
    const second = shareInFlight(bucket, 'wallet:137', run);

    expect(second).toBe(first);
    await expect(first).resolves.toBe('ok');
    expect(run).toHaveBeenCalledTimes(1);

    await expect(shareInFlight(bucket, 'wallet:137', run)).resolves.toBe('ok');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('drops the key after a failure so the next call can run', async () => {
    const bucket = new Map<string, Promise<string>>();
    const run = jest.fn(() => Promise.reject(new Error('no')));

    await expect(shareInFlight(bucket, 'wallet:137', run)).rejects.toThrow('no');
    await expect(shareInFlight(bucket, 'wallet:137', run)).rejects.toThrow('no');
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe('isAbortError', () => {
  it('recognizes an aborted request', () => {
    expect(isAbortError(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED', name: 'CanceledError' }))).toBe(
      true
    );
    expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('network'))).toBe(false);
  });
});
