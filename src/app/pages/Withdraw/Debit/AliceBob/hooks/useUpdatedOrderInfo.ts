import { useEffect, useRef } from 'react';

import { AliceBobOrderInfo, getAliceBobOrderInfo } from 'lib/alice-bob-api';

const UPDATE_INTERVAL = 5_000;

export const useUpdatedOrderInfo = (
  lastOrderInfo: AliceBobOrderInfo,
  setLastOrderInfo: (orderInfo: AliceBobOrderInfo) => void,
  setIsApiError: (isApiError: boolean) => void
) => {
  const isAlive = useRef(false);

  const { id: orderId } = lastOrderInfo;

  useEffect(() => {
    let timeoutId = setTimeout(async function repeat() {
      isAlive.current = true;

      try {
        const { orderInfo } = await getAliceBobOrderInfo({ orderId });
        if (!isAlive.current) {
          return;
        }
        setLastOrderInfo(orderInfo);
        timeoutId = setTimeout(repeat, UPDATE_INTERVAL);
      } catch (e) {
        setIsApiError(true);
      }
    }, UPDATE_INTERVAL);
    return () => {
      isAlive.current = false;
      clearTimeout(timeoutId);
    };
  }, [orderId, setIsApiError, setLastOrderInfo]);
};
