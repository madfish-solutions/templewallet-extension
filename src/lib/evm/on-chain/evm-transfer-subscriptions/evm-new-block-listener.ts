import memoizee from 'memoizee';

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

export const getEvmNewBlockListener = memoizee((httpRpcUrl: string) => new EvmNewBlockListener(httpRpcUrl));
