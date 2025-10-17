import { useEffect, useRef, useState } from 'react';

import { Book } from '@nktkas/hyperliquid';
import constate from 'constate';

import { useClients } from './clients';
import { subscriptionEffectFn } from './subscription-effect-fn';
import { OrderBookPrecision } from './types';

interface OrderBookProviderProps {
  internalCoinName: string;
}

export const [OrderBookProvider, useOrderBook] = constate(({ internalCoinName }: OrderBookProviderProps) => {
  const [orderBook, setOrderBook] = useState<Book>();
  const orderBookWasLoaded = !!orderBook;
  const [precision, setPrecision] = useState<OrderBookPrecision>({ nSigFigs: 5, mantissa: null });
  const { nSigFigs, mantissa } = precision;
  const prevInternalCoinNameRef = useRef(internalCoinName);

  const {
    clients: { subscription, info }
  } = useClients();
  useEffect(() => {
    const loadOrderBook = () =>
      info.l2Book({ coin: internalCoinName, nSigFigs, mantissa }).then(setOrderBook).catch(console.error);

    if (prevInternalCoinNameRef.current === internalCoinName) {
      return orderBookWasLoaded
        ? subscriptionEffectFn(() => subscription.l2Book({ coin: internalCoinName, nSigFigs, mantissa }, setOrderBook))
        : void loadOrderBook();
    }

    prevInternalCoinNameRef.current = internalCoinName;
    setOrderBook(undefined);
    void loadOrderBook();

    return;
  }, [internalCoinName, mantissa, nSigFigs, subscription, info, orderBookWasLoaded]);

  return { precision, setPrecision, orderBook };
});
