import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { useAccount } from 'lib/temple/front';

export const useDisabledProceed = (
  inputAmount: number | undefined,
  minExchangeAmount = 0,
  maxExchangeAmount = 0,
  isWithdraw = false
) => {
  const { publicKeyHash } = useAccount();
  const { value: tezBalance } = useBalance(TEZ_TOKEN_SLUG, publicKeyHash, { suspense: true });

  const isMinAmountError = useMemo(
    () => inputAmount !== undefined && inputAmount !== 0 && inputAmount < minExchangeAmount,
    [inputAmount, minExchangeAmount]
  );

  const isMaxAmountError = useMemo(
    () => inputAmount !== undefined && inputAmount !== 0 && inputAmount > maxExchangeAmount,
    [inputAmount, maxExchangeAmount]
  );

  const isInsufficientTezBalanceError = useMemo(() => {
    if (isWithdraw && tezBalance) {
      const gasFee = new BigNumber(0.3);
      const maxTezAmount = BigNumber.max(tezBalance.minus(gasFee), 0);

      return inputAmount !== undefined && inputAmount !== 0 && inputAmount > maxTezAmount.toNumber();
    } else {
      return false;
    }
  }, [inputAmount, isWithdraw, tezBalance]);

  const disabledProceed = useMemo(
    () =>
      isMinAmountError ||
      isMaxAmountError ||
      inputAmount === 0 ||
      inputAmount === undefined ||
      isInsufficientTezBalanceError,
    [isMinAmountError, isMaxAmountError, inputAmount, isInsufficientTezBalanceError]
  );

  return {
    isMinAmountError,
    isMaxAmountError,
    isInsufficientTezBalanceError,
    disabledProceed
  };
};
