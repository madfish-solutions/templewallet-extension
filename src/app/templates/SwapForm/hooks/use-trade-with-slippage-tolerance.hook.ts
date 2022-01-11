import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { Trade } from 'lib/swap-router/interface/trade.interface';
import { calculateTradeExactInput } from 'lib/swap-router/utils/trade.utils';

export const useTradeWithSlippageTolerance = (
  inputMutezAmountWithFee: BigNumber | undefined,
  trade: Trade,
  slippageTolerance: number | undefined
) => {
  return useMemo(() => {
    if (inputMutezAmountWithFee && slippageTolerance) {
      return calculateTradeExactInput(inputMutezAmountWithFee, trade, slippageTolerance);
    }

    return [];
  }, [inputMutezAmountWithFee, trade, slippageTolerance]);
};
