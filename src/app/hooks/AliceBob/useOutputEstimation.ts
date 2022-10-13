import { useCallback, useEffect, useState } from 'react';

import { estimateAliceBobOutput } from 'lib/alice-bob-api';

export const useOutputEstimation = (
  inputAmount: number,
  disabledProceed: boolean,
  setLoading: (v: boolean) => void,
  setIsApiError: (v: boolean) => void,
  isWithdraw = false
) => {
  const [outputAmount, setOutputAmount] = useState(0);

  const getOutputEstimation = useCallback(() => {
    if (!disabledProceed) {
      setLoading(true);
      estimateAliceBobOutput({
        isWithdraw: String(isWithdraw),
        amount: String(inputAmount)
      })
        .then(({ outputAmount }) => {
          setOutputAmount(outputAmount);
          setLoading(false);
        })
        .catch(() => setIsApiError(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledProceed, isWithdraw, inputAmount]);

  useEffect(() => {
    getOutputEstimation();
  }, [getOutputEstimation]);

  return outputAmount;
};
