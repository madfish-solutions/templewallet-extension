import memoizee from 'memoizee';

import { EvmAssetStandard } from 'lib/evm/types';

import { EvmNewBlockListener, getEvmNewBlockListener } from './evm-new-block-listener';
import { getERC1155TransferEventsListener } from './transfer-events-listeners/erc1155-transfer-events-listener';
import { getERC20TransferEventsListener } from './transfer-events-listeners/erc20-transfer-events-listener';
import { getERC721TransferEventsListener } from './transfer-events-listeners/erc721-transfer-events-listener';

const transferListenerGetters = {
  [EvmAssetStandard.ERC20]: getERC20TransferEventsListener,
  [EvmAssetStandard.ERC721]: getERC721TransferEventsListener,
  [EvmAssetStandard.ERC1155]: getERC1155TransferEventsListener
};

class EvmAssetTransfersListener {
  private listener:
    | EvmNewBlockListener
    | ReturnType<(typeof transferListenerGetters)[keyof typeof transferListenerGetters]>;

  constructor(rpcUrl: string, account: HexString, private assetSlug: string, assetStandard: EvmAssetStandard) {
    if (assetStandard === EvmAssetStandard.NATIVE) {
      this.listener = getEvmNewBlockListener(rpcUrl);
    } else {
      this.listener = transferListenerGetters[assetStandard](rpcUrl, account);
    }
  }

  /** Returns a function that cancels the subscription */
  subscribe(callback: EmptyFn) {
    let unsubscribe: EmptyFn;
    const listener = this.listener;
    if (listener instanceof EvmNewBlockListener) {
      unsubscribe = () => listener.unsubscribe(callback);
      listener.subscribe(callback);
    } else {
      const wrappedCallback = (assetSlug: string) =>
        void (assetSlug.toLowerCase() === this.assetSlug.toLowerCase() && callback());
      unsubscribe = () => listener.unsubscribe(wrappedCallback);
      listener.subscribe(wrappedCallback);
    }

    return unsubscribe;
  }
}

export const createEvmTransfersListener = memoizee(
  (rpcUrl: string, account: HexString, assetSlug: string, assetStandard: EvmAssetStandard) =>
    new EvmAssetTransfersListener(rpcUrl, account, assetSlug, assetStandard),
  { length: 4 }
);
