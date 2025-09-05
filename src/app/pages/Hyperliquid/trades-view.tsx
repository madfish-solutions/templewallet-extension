import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WsTrade } from '@nktkas/hyperliquid';
import { uniqBy } from 'lodash';

import { formatDate, toLocalFixed } from 'lib/i18n';

import { useClients } from './clients';
import { ScrollableTable } from './scrollable-table';
import { subscriptionEffectFn } from './subscription-effect-fn';
import { TradePair } from './types';
import { getDisplayCoinName } from './utils';

interface TradesViewProps {
  pair: TradePair;
}

export const TradesView = memo<TradesViewProps>(({ pair }) => {
  const internalCoinName = pair.internalName;
  const prevInternalCoinNameRef = useRef(internalCoinName);
  const {
    clients: { subscription },
    networkType,
    subscribedToWebData2
  } = useClients();
  const coinName = pair.type === 'spot' ? getDisplayCoinName(pair.baseToken.name, networkType) : pair.internalName;
  const [trades, setTrades] = useState<WsTrade[]>([]);

  const handleNewTrades = useCallback(
    (trades: WsTrade[]) => setTrades(prevTrades => trades.concat(prevTrades).slice(0, 100)),
    []
  );

  useEffect(() => {
    if (prevInternalCoinNameRef.current !== internalCoinName) {
      prevInternalCoinNameRef.current = internalCoinName;
      setTrades([]);
    }

    return subscribedToWebData2
      ? subscriptionEffectFn(() => subscription.trades({ coin: internalCoinName }, handleNewTrades))
      : undefined;
  }, [internalCoinName, subscribedToWebData2, subscription, handleNewTrades]);

  const columns = useMemo(() => ['Price', `Size (${coinName})`, 'Time'], [coinName]);

  const rows = useMemo(
    () =>
      uniqBy(trades, 'tid').map(trade => ({
        key: trade.tid,
        cells: [
          {
            children: (
              <span className={trade.side === 'A' ? 'text-error' : 'text-success'}>{toLocalFixed(trade.px)}</span>
            )
          },
          { children: toLocalFixed(trade.sz) },
          { children: formatDate(trade.time, 'HH:mm:ss') }
        ]
      })),
    [trades]
  );

  return <ScrollableTable className="flex-shrink h-80" columns={columns} rows={rows} />;
});
