import { isAbortError, retryDelayMsFromHeaderValue } from './utils';

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

describe('isAbortError', () => {
  it('recognizes an aborted request', () => {
    expect(isAbortError(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED', name: 'CanceledError' }))).toBe(
      true
    );
    expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('network'))).toBe(false);
  });
});
