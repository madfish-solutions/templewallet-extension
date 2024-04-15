import { Subscription, TezosToolkit } from '@taquito/taquito';

import { getReadOnlyTezos } from 'temple/tezos';

export class TempleTezosBlockSubscription {
  private tezos: TezosToolkit;
  private currentBlockHash?: string;
  private native: Subscription<string> | nullish;

  constructor(readonly rpcUrl: string, private onBlock: SyncFn<string>) {
    this.tezos = getReadOnlyTezos(rpcUrl);

    this.spawnSub();
  }

  destroy() {
    this.native?.close();
    delete this.native;
  }

  private spawnSub() {
    const native = this.tezos.stream.subscribe('head');
    this.native = native;

    native.on('data', hash => {
      if (this.currentBlockHash && this.currentBlockHash !== hash) {
        this.onBlock(hash);
      }

      this.currentBlockHash = hash;
    });

    native.on('error', error => {
      console.error(error);

      native.close();

      if (this.native) this.spawnSub();
    });
  }
}
