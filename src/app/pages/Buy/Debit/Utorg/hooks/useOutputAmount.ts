import { useCallback, useEffect, useState } from 'react';

import { convertFiatAmountToXtz } from 'lib/apis/utorg';

export const useOutputAmount = (inputAmountDebounced = 0, inputCurrency: string) => {
  const [outputAmount, setOutputAmount] = useState(0);
  const [isLoading, setLoading] = useState(false);

  const updateOutputRequest = useCallback(() => {
    setLoading(true);
    convertFiatAmountToXtz(inputAmountDebounced, inputCurrency)
      .then(outputAmount => setOutputAmount(outputAmount))
      .finally(() => setLoading(false));
  }, [inputAmountDebounced, inputCurrency, setLoading]);

  useEffect(() => {
    updateOutputRequest();
  }, [updateOutputRequest]);

  return { isOutputLoading: isLoading, outputAmount };
};
