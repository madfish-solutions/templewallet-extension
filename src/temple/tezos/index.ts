import { TezosToolkit, MichelCodecPacker } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import memoizee from 'memoizee';

import { FastRpcClient } from 'lib/taquito-fast-rpc';
import { rejectOnTimeout } from 'lib/utils';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';

export { TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG, confirmTezosOperation } from './confirmation';

export const michelEncoder = new MichelCodecPacker();

export const makeTezosClientId = (rpcUrl: string, accountPkh: string, straightaway = false) =>
  `${accountPkh}@${rpcUrl}@${straightaway}`;

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

export function loadTezosChainId(rpcUrl: string, timeout?: number) {
  const rpc = getTezosFastRpcClient(rpcUrl);

  if (timeout && timeout > 0)
    return rejectOnTimeout(rpc.getChainId(), timeout, new Error('Timed-out for loadTezosChainId()'));

  return rpc.getChainId();
}
