import { useCallback, useEffect, useState } from 'react';

import { getAliceBobOutputEstimation } from '../AliceBob';

export const useOutputEstimation = (
  isWithdraw: boolean,
  inputAmount: number,
  disabledProceed: boolean,
  setLoading: (v: boolean) => void
) => {
  const [outputAmount, setOutputAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);

  const getOutputEstimation = useCallback(() => {
    if (!disabledProceed) {
      setLoading(true);
      getAliceBobOutputEstimation({
        isWithdraw: String(isWithdraw),
        amount: String(inputAmount)
      }).then(({ outputAmount, exchangeRate }) => {
        setOutputAmount(outputAmount);
        setExchangeRate(exchangeRate);
        setLoading(false);
      });
    }
  }, [disabledProceed, isWithdraw, inputAmount, setLoading]);

  useEffect(() => {
    getOutputEstimation();
  }, [getOutputEstimation]);

  return { outputAmount, exchangeRate };
};
