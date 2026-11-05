import { AxiosResponse, isAxiosError } from 'axios';

import { delay } from 'lib/utils';

const DEFAULT_RETRY_AFTER_MS = 1000;

/** Delay from a `Retry-After` value. Seconds and HTTP-dates are both accepted. */
export const retryDelayMsFromHeaderValue = (header: unknown, now = Date.now()): number => {
  const value = Array.isArray(header) ? header[0] : header;

  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value * 1000);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      const seconds = Number(trimmed);
      if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

      const dateMs = Date.parse(trimmed);
      if (Number.isFinite(dateMs)) return Math.max(0, dateMs - now);
    }
  }

  return DEFAULT_RETRY_AFTER_MS;
};

const retryAfterHeader = (headers: AxiosResponse['headers'] | undefined) => {
  if (!headers) return undefined;

  if ('get' in headers && typeof headers.get === 'function') {
    const value = headers.get('retry-after');
    if (value != null && value !== '') return value;
  }

  return headers['retry-after'];
};

/** True for an aborted fetch (`AbortController` or Axios cancel). */
export const isAbortError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  return name === 'CanceledError' || name === 'AbortError' || code === 'ERR_CANCELED';
};

/** Milliseconds to wait after HTTP 429, or `undefined` when the error is not a rate limit. */
export const readRetryAfterMs = (error: unknown, now = Date.now()): number | undefined => {
  if (!isAxiosError(error) || error.response?.status !== 429) return undefined;

  return retryDelayMsFromHeaderValue(retryAfterHeader(error.response.headers), now);
};

export const withAxiosDataExtract =
  <A extends unknown[], T>(fn: (...args: A) => Promise<AxiosResponse<T>>) =>
  async (...args: A) => {
    const response = await fn(...args);

    return response.data;
  };

export async function refetchOnce429<R>(fetcher: () => Promise<R>, delayAroundInMS = 1000) {
  try {
    return await fetcher();
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response?.status === 429) {
        await delay(delayAroundInMS);
        const res = await fetcher();
        await delay(delayAroundInMS);
        return res;
      }
    }

    throw err;
  }
}
