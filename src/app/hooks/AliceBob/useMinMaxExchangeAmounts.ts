import { useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';

import { getAliceBobPairInfo } from 'lib/alice-bob-api';

const PENNY = 0.000001;

export const useMinMaxExchangeAmounts = (setIsApiError: (v: boolean) => void, isWithdraw = false) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [minExchangeAmount, setMinExchangeAmount] = useState(0);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(0);

  const updateMinMaxRequest = useCallback(() => {
    setIsMinMaxLoading(true);
    getAliceBobPairInfo({ isWithdraw: String(isWithdraw) })
      .then(({ pairInfo }) => {
        const normalizedMin = new BigNumber(pairInfo.minAmount).dp(6).plus(PENNY).toNumber();
        const normalizedMax = new BigNumber(pairInfo.maxAmount).dp(6, BigNumber.ROUND_FLOOR).toNumber();

        setMinExchangeAmount(normalizedMin);
        setMaxExchangeAmount(normalizedMax);
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
    maxExchangeAmount,
    isMinMaxLoading
  };
};
