import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { Trade } from '../interface/trade.interface';
import { calculateTradeExactInput } from '../utils/trade.utils';

export const useTradeWithSlippageTolerance = (
  inputMutezAmountWithFee: BigNumber | undefined,
  trade: Trade,
  slippageTolerance: number | undefined
) => {
  return useMemo(() => {
    if (inputMutezAmountWithFee && slippageTolerance !== undefined) {
      return calculateTradeExactInput(inputMutezAmountWithFee, trade, slippageTolerance);
    }

    return [];
  }, [inputMutezAmountWithFee, trade, slippageTolerance]);
};
