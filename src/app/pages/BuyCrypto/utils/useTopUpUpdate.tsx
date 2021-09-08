import { useEffect } from "react";

import { exchangeDataInterface, getExchangeData } from "lib/exolix-api";

const useTopUpUpdate = (
  exchangeData: exchangeDataInterface | null,
  setExchangeData: (exchangeData: exchangeDataInterface | null) => void,
  setIsError: (isError: boolean) => void
) => {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    timeoutId = setTimeout(function repeat() {
      (async () => {
        try {
          const data = await getExchangeData(exchangeData!.id);
          setExchangeData(data);
          timeoutId = setTimeout(repeat, 3000);
        } catch (e) {
          setIsError(true);
        }
      })();
    }, 3000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [exchangeData, setExchangeData, setIsError]);
};

export default useTopUpUpdate;
