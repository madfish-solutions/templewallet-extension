import { useCallback, useEffect, useState } from 'react';

import { getAliceBobPairInfo } from 'lib/alice-bob-api';

export const useUpdatedExchangeInfo = (setIsApiError: (v: boolean) => void, isWithdraw = false) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [minExchangeAmount, setMinExchangeAmount] = useState(0);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(0);

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
    maxExchangeAmount,
    isMinMaxLoading
  };
};
