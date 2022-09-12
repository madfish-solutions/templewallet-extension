import { useMemo } from 'react';

export const useDisabledProceed = (inputAmount: number, minExchangeAmount: number, maxExchangeAmount: number) => {
  const isApiError = useMemo(
    () => minExchangeAmount === 0 && maxExchangeAmount === 0,
    [minExchangeAmount, maxExchangeAmount]
  );
  const isMinAmountError = useMemo(
    () => inputAmount !== 0 && inputAmount < minExchangeAmount,
    [inputAmount, minExchangeAmount]
  );
  const isMaxAmountError = useMemo(
    () => inputAmount !== 0 && inputAmount > maxExchangeAmount,
    [inputAmount, maxExchangeAmount]
  );
  const disabledProceed = useMemo(
    () => isMinAmountError || isMaxAmountError || inputAmount === 0 || isApiError,
    [isMinAmountError, isMaxAmountError, inputAmount, isApiError]
  );

  return {
    isApiError,
    isMinAmountError,
    isMaxAmountError,
    disabledProceed
  };
};
