import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { Trade } from 'lib/swap-router/interface/trade.interface';
import { calculateTradeExactInput } from 'lib/swap-router/utils/trade.utils';
import { tokensToAtoms } from 'lib/temple/helpers';
import { AssetMetadata } from 'lib/temple/metadata';

export const useTradeWithSlippageTolerance = (
  inputAssetAmount: BigNumber | undefined,
  inputAssetMetadata: AssetMetadata,
  trade: Trade,
  slippageTolerance: number | undefined
) => {
  return useMemo(() => {
    if (inputAssetAmount && slippageTolerance) {
      const inputAssetMutezAmount = tokensToAtoms(inputAssetAmount, inputAssetMetadata.decimals);

      return calculateTradeExactInput(inputAssetMutezAmount, trade, slippageTolerance);
    }

    return [];
  }, [inputAssetAmount, inputAssetMetadata.decimals, trade, slippageTolerance]);
};
