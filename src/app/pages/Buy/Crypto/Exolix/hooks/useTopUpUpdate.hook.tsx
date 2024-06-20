import { useEffect, useRef } from 'react';

import { getExchangeData } from 'app/pages/Buy/Crypto/Exolix/exolix.util';

import { ExchangeDataInterface } from '../exolix.types';

const useTopUpUpdate = (
  exchangeData: ExchangeDataInterface | null,
  setExchangeData: (exchangeData: ExchangeDataInterface) => void,
  setIsError: (isError: boolean) => void
) => {
  const isAlive = useRef(false);

  useEffect(() => {
    let timeoutId = setTimeout(async function repeat() {
      isAlive.current = true;
      if (!exchangeData) {
        setIsError(true);
        return;
      }
      try {
        const data = await getExchangeData(exchangeData.id);
        if (!isAlive.current) {
          return;
        }
        setExchangeData(data);
        timeoutId = setTimeout(repeat, 3000);
      } catch (e) {
        setIsError(true);
      }
    }, 3000);
    return () => {
      isAlive.current = false;
      clearTimeout(timeoutId);
    };
  }, [exchangeData, setExchangeData, setIsError]);
};

export default useTopUpUpdate;
