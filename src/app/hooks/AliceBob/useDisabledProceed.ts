import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useAccount, useBalance } from 'lib/temple/front';

export const useDisabledProceed = (
  inputAmount: number,
  minExchangeAmount: number,
  maxExchangeAmount: number,
  isApiError = false,
  isCardInputError = false,
  isNotUkrainianCardError = false,
  isWithdraw = false
) => {
  const { publicKeyHash } = useAccount();
  const { data: tezBalanceData } = useBalance('tez', publicKeyHash);
  const tezBalance = tezBalanceData!;

  const isMinAmountError = useMemo(
    () => inputAmount !== 0 && inputAmount < minExchangeAmount,
    [inputAmount, minExchangeAmount]
  );

  const isMaxAmountError = useMemo(
    () => inputAmount !== 0 && inputAmount > maxExchangeAmount,
    [inputAmount, maxExchangeAmount]
  );

  const isInsufficientTezBalanceError = useMemo(() => {
    if (isWithdraw) {
      const gasFee = new BigNumber(0.3);
      const maxTezAmount = BigNumber.max(tezBalance.minus(gasFee), 0);

      return inputAmount !== 0 && inputAmount > maxTezAmount.toNumber();
    } else {
      return false;
    }
  }, [inputAmount, isWithdraw, tezBalance]);

  const disabledProceed = useMemo(
    () =>
      isMinAmountError ||
      isMaxAmountError ||
      inputAmount === 0 ||
      isApiError ||
      isCardInputError ||
      isNotUkrainianCardError ||
      isInsufficientTezBalanceError,
    [
      isMinAmountError,
      isMaxAmountError,
      inputAmount,
      isApiError,
      isCardInputError,
      isNotUkrainianCardError,
      isInsufficientTezBalanceError
    ]
  );

  return {
    isMinAmountError,
    isMaxAmountError,
    isInsufficientTezBalanceError,
    disabledProceed
  };
};
