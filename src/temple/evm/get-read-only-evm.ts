import memoizee from 'memoizee';
import { HttpTransportConfig, PublicClient, createPublicClient, fallback, http } from 'viem';

import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

/** See: https://viem.sh/docs/clients/transports/http */
const READ_ONLY_CLIENT_TRANSPORT_CONFIG: HttpTransportConfig = {
  /** Defaults to 3 */
  retryCount: 1,
  /** Defaults to 150 */
  retryDelay: 300
};

export const getReadOnlyEvm = memoizee(
  (rpcUrls: string | string[]): PublicClient =>
    createPublicClient({
      transport:
        typeof rpcUrls === 'string'
          ? http(rpcUrls, READ_ONLY_CLIENT_TRANSPORT_CONFIG)
          : fallback(
              rpcUrls.map(url => http(url, READ_ONLY_CLIENT_TRANSPORT_CONFIG)),
              { key: rpcUrls.join() }
            )
    }),
  { max: MAX_MEMOIZED_TOOLKITS, normalizer: args => JSON.stringify(args) }
);
