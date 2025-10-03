import memoizee from 'memoizee';

import { FastRpcClient } from 'lib/taquito-fast-rpc';
import { rejectOnTimeout } from 'lib/utils';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { TEZOS_FALLBACK_RPC_URLS, TezosNetworkEssentials } from 'temple/networks';

export { TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG, confirmTezosOperation } from './confirmation';

export const makeTezosClientId = (network: TezosNetworkEssentials, accountPkh: string, straightaway = false) =>
  `${accountPkh}@${JSON.stringify(network)}@${straightaway}`;

export const getTezosFastRpcClient = memoizee((rpcUrl: string) => new FastRpcClient(rpcUrl), {
  max: MAX_MEMOIZED_TOOLKITS
});

export function loadTezosChainId(rpcUrl: string, timeout?: number) {
  const matchedChainId = Object.entries(TEZOS_FALLBACK_RPC_URLS).find(([, urls]) => urls.includes(rpcUrl))?.[0];

  if (matchedChainId) return Promise.resolve(matchedChainId);

  const rpc = getTezosFastRpcClient(rpcUrl);

  if (timeout && timeout > 0)
    return rejectOnTimeout(rpc.getChainId(), timeout, new Error('Timed-out for loadTezosChainId()'));

  return rpc.getChainId();
}
