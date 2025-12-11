import { isDefined } from '@rnw-community/shared';
import { TezosToolkit, MichelCodecPacker } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import { uniq } from 'lodash';
import memoizee from 'memoizee';

import { FallbackRpcClient } from 'lib/taquito-fallback-rpc-client';
import { FastRpcClient } from 'lib/taquito-fast-rpc';
import { rejectOnTimeout } from 'lib/utils';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { DEFAULT_RPC_INDEX, TEZOS_FALLBACK_RPC_URLS, TezosNetworkEssentials } from 'temple/networks';

import { getTezosFastRpcClient } from './utils';

export { TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG, confirmTezosOperation } from './confirmation';

export const michelEncoder = new MichelCodecPacker();

export const getTezosRpcClient = memoizee(
  (network: TezosNetworkEssentials): FallbackRpcClient | FastRpcClient => {
    const fallbacks = TEZOS_FALLBACK_RPC_URLS[network.chainId];
    // TODO: Remove this after testing
    Promise.resolve(['getTezosRpcClient', { fallbacks, network, DEFAULT_RPC_INDEX }]).then(console.log);
    const shouldApplyFallbacks = isDefined(fallbacks) && network.rpcBaseURL === fallbacks[DEFAULT_RPC_INDEX];

    if (!shouldApplyFallbacks) return getTezosFastRpcClient(network.rpcBaseURL);

    return new FallbackRpcClient(uniq([network.rpcBaseURL, ...fallbacks]));
  },
  { max: MAX_MEMOIZED_TOOLKITS, normalizer: ([network]) => JSON.stringify(network) }
);

export const getTezosReadOnlyRpcClient = memoizee(
  (network: TezosNetworkEssentials): TezosToolkit => {
    const tezos = new TezosToolkit(getTezosRpcClient(network));

    tezos.setPackerProvider(michelEncoder);
    tezos.addExtension(new Tzip16Module());

    return tezos;
  },
  { max: MAX_MEMOIZED_TOOLKITS }
);

export function loadTezosChainId(rpcUrl: string, timeout?: number) {
  const matchedChainId = Object.entries(TEZOS_FALLBACK_RPC_URLS).find(([, urls]) => urls.includes(rpcUrl))?.[0];

  if (matchedChainId) return Promise.resolve(matchedChainId);

  const rpc = getTezosFastRpcClient(rpcUrl);

  if (timeout && timeout > 0)
    return rejectOnTimeout(rpc.getChainId(), timeout, new Error('Timed-out for loadTezosChainId()'));

  return rpc.getChainId();
}
