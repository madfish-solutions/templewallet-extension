import { HttpRequestFailed, HttpTimeoutError } from '@taquito/http-utils';

import { RPC_READ_TIMEOUT, RPC_WRITE_TIMEOUT, TempleHttpBackend } from './http-backend';

const RPC_URL = 'https://michelson.previewnet.tezosx.nomadic-labs.com';
const INJECTION_URL = `${RPC_URL}/injection/operation`;
const HEAD_HASH_URL = `${RPC_URL}/chains/main/blocks/head/hash`;
const SIGNED_BYTES = 'deadbeef';

const installFetch = (fetchMock: jest.Mock) =>
  Object.defineProperty(globalThis, 'fetch', { value: fetchMock, configurable: true, writable: true });

const abortingFetch = () =>
  jest.fn(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_, reject) =>
        init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
      )
  );

describe('TempleHttpBackend', () => {
  const backend = new TempleHttpBackend();
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');

  afterEach(() => {
    jest.useRealTimers();

    if (originalFetch) Object.defineProperty(globalThis, 'fetch', originalFetch);
  });

  it('gives up on a stalled read after the read timeout', async () => {
    jest.useFakeTimers();
    installFetch(abortingFetch());

    const request = backend.createRequest({ url: HEAD_HASH_URL, method: 'GET' });
    jest.advanceTimersByTime(RPC_READ_TIMEOUT);

    await expect(request).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it('keeps the longer timeout for the injection', async () => {
    jest.useFakeTimers();
    installFetch(abortingFetch());

    const request = backend.createRequest({ url: INJECTION_URL, method: 'POST' }, SIGNED_BYTES);
    jest.advanceTimersByTime(RPC_WRITE_TIMEOUT);

    await expect(request).rejects.toMatchObject({ name: 'HttpTimeoutError', timeout: RPC_WRITE_TIMEOUT });
  });

  it('reports a failed injection as one that may have reached the node', async () => {
    installFetch(jest.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const request = backend.createRequest({ url: INJECTION_URL, method: 'POST' }, SIGNED_BYTES);

    await expect(request).rejects.toBeInstanceOf(HttpRequestFailed);
    await expect(request).rejects.toMatchObject({ transportError: { kind: 'network', mayHaveReachedServer: true } });
  });
});
