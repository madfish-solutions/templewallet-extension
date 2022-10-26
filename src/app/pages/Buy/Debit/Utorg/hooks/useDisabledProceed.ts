import { useMemo } from 'react';

export const useDisabledProceed = (
  inputAmount: number | undefined,
  outputAmount: number,
  minXtzExchangeAmount: number,
  maxXtzExchangeAmount: number,
  isApiError: boolean
) => {
  const isMinAmountError = useMemo(
    () => inputAmount !== undefined && inputAmount !== 0 && outputAmount < minXtzExchangeAmount,
    [inputAmount, outputAmount, minXtzExchangeAmount]
  );
  const isMaxAmountError = useMemo(
    () => inputAmount !== undefined && inputAmount !== 0 && outputAmount > maxXtzExchangeAmount,
    [inputAmount, outputAmount, maxXtzExchangeAmount]
  );
  const disabledProceed = useMemo(
    () => isMinAmountError || isMaxAmountError || inputAmount === 0 || inputAmount === undefined || isApiError,
    [isMinAmountError, isMaxAmountError, inputAmount, isApiError]
  );

  return {
    isMinAmountError,
    isMaxAmountError,
    disabledProceed
  };
};
