import { RpcClientInterface } from '@taquito/rpc';
import { TezosToolkit, MichelCodecPacker } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import memoizee from 'memoizee';

import { FastRpcClient } from 'lib/taquito-fast-rpc';

export { TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG, confirmTezosOperation } from './confirmation';

export const MAX_MEMOIZED_TOOLKITS = 3;

export const michelEncoder = new MichelCodecPacker();

export const makeTezosChecksum = (rpcUrl: string, accountPkh: string) => `${accountPkh}@${rpcUrl}`;

export const buildFastRpcTezosToolkit = memoizee(
  (rpcUrl: string) => {
    const tezos = new TezosToolkit(buildFastRpcClient(rpcUrl));

    tezos.setPackerProvider(michelEncoder);
    tezos.addExtension(new Tzip16Module());

    return tezos;
  },
  { max: MAX_MEMOIZED_TOOLKITS }
);

// ts-prune-ignore-next
export class TempleTezosToolkit extends TezosToolkit {
  public readonly rpcUrl: string;
  constructor(rpc: string | RpcClientInterface, public readonly chainId: string) {
    super(rpc);
    this.rpcUrl = typeof rpc === 'string' ? rpc : rpc.getRpcUrl();
  }
}

export class ReactiveTezosToolkit extends TezosToolkit {
  checksum: string;

  constructor(rpcUrl: string, accountPkh: string) {
    super(buildFastRpcClient(rpcUrl));

    this.checksum = makeTezosChecksum(rpcUrl, accountPkh);

    this.setPackerProvider(michelEncoder);
    this.addExtension(new Tzip16Module());
  }
}

export const buildFastRpcClient = memoizee((rpc: string) => new FastRpcClient(rpc), { max: MAX_MEMOIZED_TOOLKITS });

export function loadTezosChainId(rpcUrl: string) {
  const rpc = buildFastRpcClient(rpcUrl);

  return rpc.getChainId();
}
