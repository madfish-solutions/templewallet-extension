import BigNumber from 'bignumber.js';

import { TokenInterface } from '../../lib/swap-router/token.interface';
import { TempleAssetType } from '../../lib/temple/front';
import { SwapInputValue } from './SwapForm/SwapInput';

export const swapInputAssetToTokenInterface = (asset: SwapInputValue['asset']): TokenInterface => {
  if (asset !== undefined) {
    switch (asset.type) {
      case TempleAssetType.TEZ:
        return { address: 'tez' };

      case TempleAssetType.FA1_2:
        return { address: asset.address };

      case TempleAssetType.FA2:
        return { address: asset.address, id: new BigNumber(asset.id) };
    }
  }

  return { address: 'tez' };
};
