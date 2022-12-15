import { useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';

import { getAliceBobPairInfo } from 'lib/apis/temple';

const PENNY = 0.000001;

export const useMinMaxExchangeAmounts = (setIsApiError: (v: boolean) => void, isWithdraw = false) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [minExchangeAmount, setMinExchangeAmount] = useState(0);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(0);

  const updateMinMaxRequest = useCallback(() => {
    setIsMinMaxLoading(true);
    getAliceBobPairInfo(isWithdraw)
      .then(response => {
        const normalizedMin = new BigNumber(response.data.pairInfo.minAmount)
          .dp(6)
          .plus(isWithdraw ? PENNY : 0)
          .toNumber();
        const normalizedMax = new BigNumber(response.data.pairInfo.maxAmount).dp(6, BigNumber.ROUND_FLOOR).toNumber();

        setMinExchangeAmount(normalizedMin);
        setMaxExchangeAmount(normalizedMax);
      })
      .catch(() => setIsApiError(true))
      .finally(() => setIsMinMaxLoading(false));
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
