import { useCallback, useEffect, useState } from 'react';

import { convertFiatAmountToXtz } from '../../../../../../lib/utorg-api';
import { booleanSetter } from '../config';

export const useOutputAmount = (
  inputAmountDebounced: number,
  inputCurrency: string,
  setLoading: booleanSetter,
  setIsApiError: booleanSetter
) => {
  const [outputAmount, setOutputAmount] = useState(0);

  const updateOutputRequest = useCallback(() => {
    setLoading(true);
    convertFiatAmountToXtz(inputAmountDebounced, inputCurrency)
      .then(outputAmount => {
        setOutputAmount(outputAmount);
        setLoading(false);
      })
      .catch(() => {
        setIsApiError(true);
        setLoading(false);
      });
  }, [inputAmountDebounced, inputCurrency, setIsApiError, setLoading]);

  useEffect(() => {
    updateOutputRequest();
  }, [updateOutputRequest]);

  return outputAmount;
};
