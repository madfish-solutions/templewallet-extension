import memoizee from 'memoizee';
import {
  FallbackTransport,
  HttpTransport,
  HttpTransportConfig,
  PublicClient,
  createPublicClient,
  fallback,
  http
} from 'viem';

import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

/** See: https://viem.sh/docs/clients/transports/http */
const READ_ONLY_CLIENT_TRANSPORT_CONFIG: HttpTransportConfig = {
  /** Defaults to 3 */
  retryCount: 1,
  /** Defaults to 150 */
  retryDelay: 300
};

type HttpPublicClient = PublicClient<HttpTransport>;
type HttpFallbacksPublicClient = PublicClient<FallbackTransport<HttpTransport[]>>;

function getReadOnlyEvmBeforeMemo(rpcUrl: string): HttpPublicClient;
function getReadOnlyEvmBeforeMemo(rpcUrls: string[]): HttpFallbacksPublicClient;
function getReadOnlyEvmBeforeMemo(rpcUrls: string | string[]): HttpPublicClient | HttpFallbacksPublicClient {
  if (typeof rpcUrls === 'string') {
    return createPublicClient({ transport: http(rpcUrls, READ_ONLY_CLIENT_TRANSPORT_CONFIG) });
  }

  return createPublicClient({
    transport: fallback(
      rpcUrls.map(url => http(url, READ_ONLY_CLIENT_TRANSPORT_CONFIG)),
      { key: rpcUrls.join() }
    )
  });
}

export const getReadOnlyEvm = memoizee(getReadOnlyEvmBeforeMemo, {
  max: MAX_MEMOIZED_TOOLKITS,
  normalizer: args => JSON.stringify(args)
});
