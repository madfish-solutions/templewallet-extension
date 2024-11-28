import memoizee from 'memoizee';
import { HttpTransportConfig, PublicClient, createPublicClient, http } from 'viem';

import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

/** See: https://viem.sh/docs/clients/transports/http */
const READ_ONLY_CLIENT_TRANSPORT_CONFIG: HttpTransportConfig = {
  /** Defaults to 3 */
  retryCount: 1,
  /** Defaults to 150 */
  retryDelay: 300
};

export const getReadOnlyEvm = memoizee(
  (rpcUrl: string): PublicClient =>
    createPublicClient({
      transport: http(rpcUrl, READ_ONLY_CLIENT_TRANSPORT_CONFIG)
    }),
  { max: MAX_MEMOIZED_TOOLKITS }
);
