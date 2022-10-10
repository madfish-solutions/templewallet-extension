import { useCallback, useEffect, useState } from 'react';

import { getAliceBobPairInfo } from 'lib/alice-bob-api';

export const useUpdatedExchangeInfo = (isWithdraw = false) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [minExchangeAmount, setMinExchangeAmount] = useState(1);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(1);

  const updateMinMaxRequest = useCallback(() => {
    setIsMinMaxLoading(true);
    getAliceBobPairInfo({ isWithdraw: String(isWithdraw) })
      .then(response => {
        setMinExchangeAmount(response.minAmount);
        setMaxExchangeAmount(response.maxAmount);
      })
      .catch(() => {
        setMinExchangeAmount(0);
        setMaxExchangeAmount(0);
      })
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
