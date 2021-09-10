import { useEffect } from "react";

import { ExchangeDataInterface, getExchangeData } from "lib/exolix-api";

const useTopUpUpdate = (
  exchangeData: ExchangeDataInterface | null,
  setExchangeData: (exchangeData: ExchangeDataInterface | null) => void,
  setIsError: (isError: boolean) => void
) => {
  useEffect(() => {
    let timeoutId = setTimeout(async function repeat() {
      try {
        const data = await getExchangeData(exchangeData!.id);
        setExchangeData(data);
        timeoutId = setTimeout(repeat, 3000);
      } catch (e) {
        setIsError(true);
      }
    }, 3000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [exchangeData, setExchangeData, setIsError]);
};

export default useTopUpUpdate;
