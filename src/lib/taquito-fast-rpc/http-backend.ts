import {
  classifyTransportError,
  HttpBackend,
  HttpRequestFailed,
  HttpRequestOptions,
  HttpResponseError,
  HttpTimeoutError
} from '@taquito/http-utils';

/** 15 sec */
export const RPC_READ_TIMEOUT = 15_000;

/** 30 sec, Taquito's own default */
export const RPC_WRITE_TIMEOUT = 30_000;

const INJECTION_PATH = '/injection/operation';

/**
 * Bounds every request to the read timeout except the injection, which keeps Taquito's 30 s and is sent exactly once:
 * Taquito retries a POST that fails with a network error, which can re-inject an operation the node already accepted.
 */
export class TempleHttpBackend extends HttpBackend {
  constructor() {
    super(RPC_READ_TIMEOUT);
  }

  createRequest<T>(options: HttpRequestOptions, data?: object | string): Promise<T> {
    if (options.url.endsWith(INJECTION_PATH)) return this.createSingleAttemptRequest(options, data);

    return super.createRequest(options, data);
  }

  private async createSingleAttemptRequest<T>(
    { url, method = 'POST', timeout = RPC_WRITE_TIMEOUT, query, headers = {} }: HttpRequestOptions,
    data?: object | string
  ): Promise<T> {
    const urlWithQuery = url + this.serialize(query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await globalThis.fetch(urlWithQuery, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      if (response.status >= 400) {
        const body = await response.text();

        throw new HttpResponseError(
          `Http error response: (${response.status}) ${body}`,
          response.status,
          response.statusText,
          body,
          urlWithQuery
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof HttpResponseError) throw error;

      const cause = error instanceof Error ? error : new Error(String(error));
      const transportError = classifyTransportError(cause);

      if (transportError?.kind === 'abort') throw new HttpTimeoutError(timeout, urlWithQuery);

      throw new HttpRequestFailed(method, urlWithQuery, cause, transportError);
    } finally {
      clearTimeout(timer);
    }
  }
}
