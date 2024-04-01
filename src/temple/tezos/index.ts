import { TezosToolkit, MichelCodecPacker } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import memoizee from 'memoizee';

import { FastRpcClient } from 'lib/taquito-fast-rpc';

export { TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG, confirmTezosOperation } from './confirmation';

export const MAX_MEMOIZED_TOOLKITS = 3;

export const michelEncoder = new MichelCodecPacker();

export const makeTezosClientId = (rpcUrl: string, accountPkh: string) => `${accountPkh}@${rpcUrl}`;

export const getReadOnlyTezos = memoizee(
  (rpcUrl: string) => {
    const tezos = new TezosToolkit(getTezosFastRpcClient(rpcUrl));

    tezos.setPackerProvider(michelEncoder);
    tezos.addExtension(new Tzip16Module());

    return tezos;
  },
  { max: MAX_MEMOIZED_TOOLKITS }
);

export const getTezosFastRpcClient = memoizee((rpcUrl: string) => new FastRpcClient(rpcUrl), {
  max: MAX_MEMOIZED_TOOLKITS
});

export function loadTezosChainId(rpcUrl: string) {
  const rpc = getTezosFastRpcClient(rpcUrl);

  return rpc.getChainId();
}
