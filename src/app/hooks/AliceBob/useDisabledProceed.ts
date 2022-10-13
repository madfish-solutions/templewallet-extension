import { useMemo } from 'react';

export const useDisabledProceed = (
  inputAmount: number,
  minExchangeAmount: number,
  maxExchangeAmount: number,
  isApiError = false,
  isCardInputError = false,
  isNotUkrainianCardError = false
) => {
  const isMinAmountError = useMemo(
    () => inputAmount !== 0 && inputAmount < minExchangeAmount,
    [inputAmount, minExchangeAmount]
  );
  const isMaxAmountError = useMemo(
    () => inputAmount !== 0 && inputAmount > maxExchangeAmount,
    [inputAmount, maxExchangeAmount]
  );
  const disabledProceed = useMemo(
    () =>
      isMinAmountError ||
      isMaxAmountError ||
      inputAmount === 0 ||
      isApiError ||
      isCardInputError ||
      isNotUkrainianCardError,
    [isMinAmountError, isMaxAmountError, inputAmount, isApiError, isCardInputError, isNotUkrainianCardError]
  );

  return {
    isMinAmountError,
    isMaxAmountError,
    disabledProceed
  };
};
