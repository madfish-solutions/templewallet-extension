import { delay } from 'lib/utils';
import { ChainPublicClient, getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { Listener, ListenerCallback } from './listener';

export abstract class EvmHttpRpcListener<T extends unknown[] = []> extends Listener<T> {
  protected rpcClient: ChainPublicClient;
  protected isActive = false;
  protected cancelSubscription: EmptyFn | null = null;

  constructor(network: EvmNetworkEssentials) {
    super();
    this.rpcClient = getViemPublicClient(network);
  }

  protected abstract subscribeToRpcEvents(): Promise<EmptyFn>;

  protected startListening() {
    this.subscribeToRpcEvents()
      .then(cancelSubscription => {
        if (this.isActive) {
          this.cancelSubscription = cancelSubscription;
        } else {
          cancelSubscription();
        }
      })
      .catch(e => console.error(e));
  }

  protected stopListening() {
    if (this.cancelSubscription) {
      this.cancelSubscription();
      this.cancelSubscription = null;
    }
  }

  protected activate() {
    this.isActive = true;
    this.startListening();
  }

  protected deactivate() {
    this.isActive = false;
    this.stopListening();
  }

  subscribe(listener: ListenerCallback<T>) {
    if (this.callbacks.length === 0) {
      this.activate();
    }
    super.subscribe(listener);
  }

  unsubscribe(listener: ListenerCallback<T>) {
    super.unsubscribe(listener);
    if (this.callbacks.length === 0) {
      this.deactivate();
    }
  }

  protected async onError(error: unknown) {
    if (!this.isActive) {
      return;
    }

    console.error(error);
    this.stopListening();
    await delay(1000);
    this.startListening();
  }
}
