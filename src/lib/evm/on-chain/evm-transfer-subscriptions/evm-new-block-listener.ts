import memoizee from 'memoizee';

import { EvmNetworkEssentials } from 'temple/networks';

import { EvmHttpRpcListener } from './evm-http-rpc-listener';

/** Do not construct directly; use `getEvmNewBlockListener` instead */
export class EvmNewBlockListener extends EvmHttpRpcListener {
  protected async subscribeToRpcEvents() {
    return this.rpcClient.watchBlockNumber({
      onBlockNumber: () => this.emit(),
      onError: e => this.onError(e)
    });
  }
}

export const getEvmNewBlockListener = memoizee((network: EvmNetworkEssentials) => new EvmNewBlockListener(network));
