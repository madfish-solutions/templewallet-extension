import { useMemo } from 'react';

export const useDisabledProceed = (
  inputAmount: number | undefined,
  minAmount: number,
  maxAmount: number,
  isApiError: boolean
) => {
  const isMinAmountError = useMemo(
    () => inputAmount != null && inputAmount > 0 && inputAmount < minAmount,
    [inputAmount, minAmount]
  );

  const isMaxAmountError = useMemo(
    () => inputAmount != null && inputAmount > 0 && inputAmount > maxAmount,
    [inputAmount, maxAmount]
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
