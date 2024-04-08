import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { TezosNetworkEssentials } from 'temple/networks';

export const useDisabledProceed = (
  network: TezosNetworkEssentials,
  publicKeyHash: string,
  inputAmount: number | undefined,
  minExchangeAmount = 0,
  maxExchangeAmount = 0,
  isWithdraw = false
) => {
  const {
    value: tezBalance,
    isSyncing: tezBalanceSyncing,
    error: tezBalanceError
  } = useTezosAssetBalance(TEZ_TOKEN_SLUG, publicKeyHash, network);

  const tezBalanceLoading = useMemo(() => !tezBalance && tezBalanceSyncing, [tezBalance, tezBalanceSyncing]);

  const isMinAmountError = useMemo(
    () => inputAmount !== undefined && inputAmount !== 0 && inputAmount < minExchangeAmount,
    [inputAmount, minExchangeAmount]
  );

  const isMaxAmountError = useMemo(
    () => inputAmount !== undefined && inputAmount !== 0 && inputAmount > maxExchangeAmount,
    [inputAmount, maxExchangeAmount]
  );

  const isInsufficientTezBalanceError = useMemo(() => {
    if (!isWithdraw) return false;
    if (tezBalanceError) return true;
    if (!tezBalance) return false;

    const gasFee = new BigNumber(0.3);
    const maxTezAmount = BigNumber.max(tezBalance.minus(gasFee), 0);

    return inputAmount !== undefined && inputAmount !== 0 && inputAmount > maxTezAmount.toNumber();
  }, [inputAmount, isWithdraw, tezBalance, tezBalanceError]);

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
    tezBalanceLoading,
    isMinAmountError,
    isMaxAmountError,
    isInsufficientTezBalanceError,
    disabledProceed
  };
};
