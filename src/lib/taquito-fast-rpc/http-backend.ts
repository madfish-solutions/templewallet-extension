import { HttpBackend, HttpRequestOptions } from '@taquito/http-utils';

/** 15 sec */
export const RPC_READ_TIMEOUT = 15_000;

/** 30 sec, Taquito's own default */
export const RPC_WRITE_TIMEOUT = 30_000;

const INJECTION_PATH = '/injection/operation';

// Reads fail fast; the injection keeps the longer timeout, because aborting it leaves the operation's outcome unknown
export class TempleHttpBackend extends HttpBackend {
  constructor() {
    super(RPC_READ_TIMEOUT);
  }

  createRequest<T>(options: HttpRequestOptions, data?: object | string): Promise<T> {
    return super.createRequest(
      options.url.endsWith(INJECTION_PATH) ? { ...options, timeout: RPC_WRITE_TIMEOUT } : options,
      data
    );
  }
}
