import { useEffect, useRef } from 'react';

import { toastError } from 'app/toaster';
import { getExchangeData } from 'lib/apis/exolix/utils';

import { useCryptoExchangeDataState } from '../context';

export const useTopUpUpdate = () => {
  const { exchangeData, setExchangeData } = useCryptoExchangeDataState();

  const isAlive = useRef(false);

  useEffect(() => {
    let timeoutId = setTimeout(async function repeat() {
      isAlive.current = true;
      if (!exchangeData) return;

      try {
        const data = await getExchangeData(exchangeData.id);
        if (!isAlive.current) {
          return;
        }
        setExchangeData(data);
        timeoutId = setTimeout(repeat, 3000);
      } catch (e) {
        toastError('Failed to update order status!');
      }
    }, 3000);

    return () => {
      isAlive.current = false;
      clearTimeout(timeoutId);
    };
  }, [exchangeData, setExchangeData]);
};
