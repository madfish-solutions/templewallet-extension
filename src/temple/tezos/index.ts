import { TezosToolkit, MichelCodecPacker } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import memoizee from 'memoizee';

import { rejectOnTimeout } from 'lib/utils';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { TEZOS_FALLBACK_RPC_URLS, TezosNetworkEssentials } from 'temple/networks';

import { getTezosRpcClient } from './rpc-client';
import { getTezosFastRpcClient } from './utils';

export * from './confirmation';
export * from './network-timing';
export * from './rpc-client';

export const michelEncoder = new MichelCodecPacker();

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
