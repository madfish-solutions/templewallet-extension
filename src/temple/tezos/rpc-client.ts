import { isDefined } from '@rnw-community/shared';
import { uniq } from 'lodash';
import memoizee from 'memoizee';

import { FallbackRpcClient } from 'lib/taquito-fallback-rpc-client';
import { FastRpcClient } from 'lib/taquito-fast-rpc';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { DEFAULT_RPC_INDEX, TEZOS_FALLBACK_RPC_URLS, TezosNetworkEssentials } from 'temple/networks';

import { getTezosFastRpcClient } from './utils';

export const getTezosRpcClient = memoizee(
  (network: TezosNetworkEssentials): FallbackRpcClient | FastRpcClient => {
    const fallbacks = TEZOS_FALLBACK_RPC_URLS[network.chainId];
    const shouldApplyFallbacks = isDefined(fallbacks) && network.rpcBaseURL === fallbacks[DEFAULT_RPC_INDEX];

    if (!shouldApplyFallbacks) return getTezosFastRpcClient(network.rpcBaseURL);

    return new FallbackRpcClient(uniq([network.rpcBaseURL].concat(fallbacks)));
  },
  { max: MAX_MEMOIZED_TOOLKITS, normalizer: ([network]) => JSON.stringify(network) }
);
