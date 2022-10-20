import { useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { getAliceBobPairInfo } from 'lib/alice-bob-api';
import { useAccount, useBalance } from 'lib/temple/front';

export const useMinMaxExchangeAmounts = (setIsApiError: (v: boolean) => void, isWithdraw = false) => {
  const { publicKeyHash } = useAccount();
  const { data: tezBalanceData } = useBalance('tez', publicKeyHash);
  const tezBalance = tezBalanceData!;

  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [minExchangeAmount, setMinExchangeAmount] = useState(0);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(0);

  const finalMaxExchangeAmount = useMemo(() => {
    if (isWithdraw) {
      const gasFee = new BigNumber(0.3);
      const maxTezAmount = BigNumber.max(tezBalance.minus(gasFee), 0);

      return BigNumber.min(maxExchangeAmount, maxTezAmount).toNumber();
    } else {
      return maxExchangeAmount;
    }
  }, [isWithdraw, maxExchangeAmount, tezBalance]);

  const updateMinMaxRequest = useCallback(() => {
    setIsMinMaxLoading(true);
    getAliceBobPairInfo({ isWithdraw: String(isWithdraw) })
      .then(({ pairInfo }) => {
        setMinExchangeAmount(pairInfo.minAmount);
        setMaxExchangeAmount(pairInfo.maxAmount);
      })
      .catch(() => setIsApiError(true))
      .finally(() => setIsMinMaxLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdraw]);

  useEffect(() => {
    updateMinMaxRequest();
  }, [updateMinMaxRequest]);

  return {
    minExchangeAmount,
    maxExchangeAmount: finalMaxExchangeAmount,
    isMinMaxLoading
  };
};
