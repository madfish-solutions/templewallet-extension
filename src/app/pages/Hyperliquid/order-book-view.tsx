import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Book, BookLevel, WsL2BookParameters } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { CellPartProps, SelectWithModal } from 'app/templates/select-with-modal';
import { toLocalFixed } from 'lib/i18n';
import { NullComponent } from 'lib/ui/null-component';
import { ZERO } from 'lib/utils/numbers';
import { SearchKey } from 'lib/utils/search-items';

import { useClients } from './clients';
import { ScrollableTable } from './scrollable-table';
import { HyperliquidSelectors } from './selectors';
import { subscriptionEffectFn } from './subscription-effect-fn';
import { TradePair } from './types';
import { getDisplayCoinName } from './utils';

interface OrderBookViewProps {
  pair: TradePair;
}

type OrderBookPrecision = Pick<WsL2BookParameters, 'mantissa' | 'nSigFigs'>;

const orderBookPrecisionOptions: OrderBookPrecision[] = [
  { nSigFigs: 5, mantissa: null },
  { nSigFigs: 5, mantissa: 2 },
  { nSigFigs: 5, mantissa: 5 },
  { nSigFigs: 4, mantissa: null },
  { nSigFigs: 3, mantissa: null },
  { nSigFigs: 2, mantissa: null }
];

const searchKeys: SearchKey<OrderBookPrecision, null>[] = [];

const orderBookPrecisionKeyFn = ({ nSigFigs, mantissa }: OrderBookPrecision) => `${nSigFigs}-${mantissa}`;

export const OrderBookView = memo<OrderBookViewProps>(({ pair }) => {
  const internalCoinName = pair.internalName;
  const prevInternalCoinNameRef = useRef(internalCoinName);
  const {
    clients: { subscription, info },
    networkType
  } = useClients();
  const coinName = pair.type === 'spot' ? getDisplayCoinName(pair.baseToken.name, networkType) : pair.internalName;
  const [orderBook, setOrderBook] = useState<Book>();
  const orderBookWasLoaded = !!orderBook;
  const [precision, setPrecision] = useState<OrderBookPrecision>(orderBookPrecisionOptions[0]);
  const { nSigFigs, mantissa } = precision;

  const priceExponent = useMemo(() => {
    const price = orderBook?.levels[0][0]?.px;

    return price ? Math.floor(Math.log10(Number(price))) : undefined;
  }, [orderBook]);

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

  useEffect(() => setOrderBook(undefined), [internalCoinName]);

  const PrecisionOptionName = useCallback(
    ({ option }: CellPartProps<OrderBookPrecision>) => (
      <span>
        {priceExponent === undefined
          ? ''
          : new BigNumber(1)
              .shiftedBy(priceExponent - (option.nSigFigs ?? 5) + 1)
              .times(option.mantissa ?? 1)
              .toFixed()}
      </span>
    ),
    [priceExponent]
  );

  if (!orderBook) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex">
        <SelectWithModal
          title="Precision"
          testID={HyperliquidSelectors.orderBookPrecisionSelect}
          CellIcon={NullComponent}
          ModalCellIcon={NullComponent}
          CellName={PrecisionOptionName}
          value={precision}
          onSelect={setPrecision}
          className="flex-1"
          options={orderBookPrecisionOptions}
          keyFn={orderBookPrecisionKeyFn}
          itemTestID={HyperliquidSelectors.orderBookPrecisionSelectItem}
          searchKeys={searchKeys}
        />
        <div className="flex-[3]" />
      </div>
      <div className="flex gap-4">
        <OrderBookTable coinName={coinName} orderBookLevels={orderBook.levels} />
      </div>
    </div>
  );
});

interface OrderBookTableProps {
  coinName: string;
  orderBookLevels: [BookLevel[], BookLevel[]];
}

export const OrderBookTable = memo<OrderBookTableProps>(({ coinName, orderBookLevels }) => {
  const rowsProps = useMemo(() => {
    const rowsPropsPart = orderBookLevels.map(sideLevels =>
      sideLevels.slice(0, 12).reduce<{ price: string; size: BigNumber; totalSize: BigNumber }[]>((acc, level) => {
        const { px: price, sz } = level;
        const size = new BigNumber(sz);
        const prevTotalSize = acc.at(-1)?.totalSize ?? ZERO;
        acc.push({ price, size, totalSize: prevTotalSize.plus(size) });

        return acc;
      }, [])
    );

    const maxTotalSize = BigNumber.max(...rowsPropsPart.map(sideRowsProps => sideRowsProps.at(-1)?.totalSize ?? ZERO));

    return rowsPropsPart
      .map((sideRowsProps, index) =>
        sideRowsProps
          .map(({ price, size, totalSize }) => ({
            price,
            size,
            totalSize,
            totalSizePercentage: totalSize.div(maxTotalSize).times(100).toNumber()
          }))
          .sort((a, b) => (a.totalSizePercentage - b.totalSizePercentage) * (index === 0 ? 1 : -1))
          .map(({ price, size, totalSize, totalSizePercentage }) => ({
            key: price,
            className: 'relative',
            cells: [
              { children: toLocalFixed(price) },
              { children: toLocalFixed(size) },
              {
                children: (
                  <React.Fragment key="total-size">
                    <div
                      className={clsx(
                        'absolute top-0 bottom-0 left-0 opacity-15',
                        index === 0 ? 'bg-success' : 'bg-error'
                      )}
                      style={{ width: `${totalSizePercentage}%` }}
                    />
                    {toLocalFixed(totalSize)}
                  </React.Fragment>
                )
              }
            ]
          }))
      )
      .reverse();
  }, [orderBookLevels]);

  const columns = useMemo(() => ['Price', `Size (${coinName})`, `Total Size (${coinName})`], [coinName]);

  return (
    <>
      {rowsProps.map((sideRowsProps, index) => (
        <ScrollableTable className="flex-1" key={index} columns={columns} rows={sideRowsProps} />
      ))}
    </>
  );
});
