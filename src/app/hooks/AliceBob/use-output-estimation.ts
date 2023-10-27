import { useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { estimateAliceBobOutput } from 'lib/apis/temple';

export const useOutputEstimation = (
  inputAmount = 0,
  outputAssetCode: string,
  isMinAmountError: boolean,
  isMaxAmountError: boolean,
  setIsApiError: (v: boolean) => void
) => {
  const [outputAmount, setOutputAmount] = useState(0);
  const [estimationIsLoading, setLoading] = useState(false);

  const isValidInput = useMemo(
    () => inputAmount > 0 && !isMinAmountError && !isMaxAmountError,
    [inputAmount, isMaxAmountError, isMinAmountError]
  );

  const getOutputEstimation = useCallback(() => {
    if (isValidInput) {
      setLoading(true);

      estimateAliceBobOutput(inputAmount.toString(), 'XTZ', outputAssetCode)
        .then(response => {
          setOutputAmount(new BigNumber(response.data.outputAmount).dp(2, BigNumber.ROUND_FLOOR).toNumber());
        })
        .catch(() => setIsApiError(true))
        .finally(() => setLoading(false));
    }
  }, [inputAmount, isValidInput, outputAssetCode, setIsApiError]);

  useEffect(() => {
    getOutputEstimation();
  }, [getOutputEstimation]);

  useEffect(() => {
    if (!isValidInput && outputAmount !== 0) {
      setOutputAmount(0);
    }
  }, [isValidInput, outputAmount]);

  return { estimationIsLoading, outputAmount };
};
