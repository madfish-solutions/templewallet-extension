import { RpcClientInterface } from '@taquito/rpc';
import { TezosToolkit } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import memoizee from 'memoizee';

import { loadFastRpcClient, michelEncoder } from 'lib/temple/helpers';
import { StoredAccountBase, TempleAccountType } from 'lib/temple/types';

export const isTezosAccountOfActableType = (account: StoredAccountBase) =>
  !(account.type === TempleAccountType.WatchOnly || account.type === TempleAccountType.ManagedKT);

export const buildFastRpcTezosToolkit = memoizee(
  (rpcUrl: string) => {
    const tezos = new TezosToolkit(loadFastRpcClient(rpcUrl));

    tezos.setPackerProvider(michelEncoder);
    tezos.addExtension(new Tzip16Module());

    return tezos;
  },
  { max: 3 }
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
  constructor(rpc: string | RpcClientInterface, public checksum: string) {
    super(rpc);
    this.addExtension(new Tzip16Module());
  }
}
