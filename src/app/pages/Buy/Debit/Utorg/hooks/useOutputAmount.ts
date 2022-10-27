import { useCallback, useEffect, useState } from 'react';

import { convertFiatAmountToXtz } from '../../../../../../lib/utorg-api';
import { booleanSetter } from '../config';

export const useOutputAmount = (inputAmountDebounced = 0, inputCurrency: string, setLoading: booleanSetter) => {
  const [outputAmount, setOutputAmount] = useState(0);

  const updateOutputRequest = useCallback(() => {
    setLoading(true);
    convertFiatAmountToXtz(inputAmountDebounced, inputCurrency)
      .then(outputAmount => setOutputAmount(outputAmount))
      .finally(() => setLoading(false));
  }, [inputAmountDebounced, inputCurrency, setLoading]);

  useEffect(() => {
    updateOutputRequest();
  }, [updateOutputRequest]);

  return outputAmount;
};
