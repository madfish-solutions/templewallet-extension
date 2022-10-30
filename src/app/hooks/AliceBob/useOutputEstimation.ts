import { useCallback, useEffect, useMemo, useState } from 'react';

import { estimateAliceBobOutput } from 'lib/templewallet-api';

export const useOutputEstimation = (
  inputAmount = 0,
  isMinAmountError: boolean,
  isMaxAmountError: boolean,
  setLoading: (v: boolean) => void,
  setIsApiError: (v: boolean) => void,
  isWithdraw = false
) => {
  const [outputAmount, setOutputAmount] = useState(0);

  const isValidInput = useMemo(
    () => inputAmount > 0 && !isMinAmountError && !isMaxAmountError,
    [inputAmount, isMaxAmountError, isMinAmountError]
  );

  const getOutputEstimation = useCallback(() => {
    if (isValidInput) {
      setLoading(true);

      estimateAliceBobOutput(isWithdraw, inputAmount.toString())
        .then(response => {
          setOutputAmount(response.data.outputAmount);
        })
        .catch(() => setIsApiError(true))
        .finally(() => setLoading(false));
    }
  }, [inputAmount, isValidInput, isWithdraw, setIsApiError, setLoading]);

  useEffect(() => {
    getOutputEstimation();
  }, [getOutputEstimation]);

  useEffect(() => {
    if (!isValidInput && outputAmount !== 0) {
      setOutputAmount(0);
    }
  }, [isValidInput, outputAmount]);

  return outputAmount;
};
