import { useCallback, useEffect, useState } from 'react';

import { getAliceBobOutputEstimation } from 'lib/alice-bob-api';

export const useOutputEstimation = (
  inputAmount: number,
  disabledProceed: boolean,
  setLoading: (v: boolean) => void,
  isWithdraw = false
) => {
  const [outputAmount, setOutputAmount] = useState(0);

  const getOutputEstimation = useCallback(() => {
    if (!disabledProceed) {
      setLoading(true);
      getAliceBobOutputEstimation({
        isWithdraw: String(isWithdraw),
        amount: String(inputAmount)
      }).then(({ outputAmount }) => {
        setOutputAmount(outputAmount);
        setLoading(false);
      });
    }
  }, [disabledProceed, isWithdraw, inputAmount, setLoading]);

  useEffect(() => {
    getOutputEstimation();
  }, [getOutputEstimation]);

  return outputAmount;
};
