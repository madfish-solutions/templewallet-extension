import memoizee from 'memoizee';

import { EvmAssetStandard } from 'lib/evm/types';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmNewBlockListener, getEvmNewBlockListener } from './evm-new-block-listener';
import { getERC1155TransferEventsListener } from './transfer-events-listeners/erc1155-transfer-events-listener';
import { getERC20TransferEventsListener } from './transfer-events-listeners/erc20-transfer-events-listener';
import { getERC721TransferEventsListener } from './transfer-events-listeners/erc721-transfer-events-listener';

const transferListenerGetters = {
  [EvmAssetStandard.NATIVE]: getEvmNewBlockListener,
  [EvmAssetStandard.ERC20]: getERC20TransferEventsListener,
  [EvmAssetStandard.ERC721]: getERC721TransferEventsListener,
  [EvmAssetStandard.ERC1155]: getERC1155TransferEventsListener
};

class EvmAssetTransfersListener {
  private listener: ReturnType<(typeof transferListenerGetters)[EvmAssetStandard]>;

  constructor(
    network: EvmNetworkEssentials,
    account: HexString,
    private assetSlug: string,
    assetStandard: EvmAssetStandard
  ) {
    if (assetStandard === EvmAssetStandard.NATIVE) {
      this.listener = getEvmNewBlockListener(network);
    } else {
      this.listener = transferListenerGetters[assetStandard](network, account);
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
  (network: EvmNetworkEssentials, account: HexString, assetSlug: string, assetStandard: EvmAssetStandard) =>
    new EvmAssetTransfersListener(network, account, assetSlug, assetStandard),
  { length: 4 }
);
