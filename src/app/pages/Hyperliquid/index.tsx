import React, { memo, useCallback, useState } from 'react';

import { capitalize } from 'lodash';

import { OpenInFullPage, useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import { CellPartProps, SelectWithModal } from 'app/templates/select-with-modal';
import { NullComponent } from 'lib/ui/null-component';

import { HyperliquidClientsProvider } from './clients';
import { OrderBookView } from './order-book-view';
import { PriceChart } from './price-chart';
import { HyperliquidSelectors } from './selectors';
import { CandleChartInterval, TradePair } from './types';
import { useTradePairs } from './use-trade-pairs';

export const HyperliquidPage = memo(() => {
  const { fullPage } = useAppEnv();

  return (
    <>
      {!fullPage && <OpenInFullPage />}

      <PageLayout pageTitle="Hyperliquid" paperClassName="w-[48rem]">
        <HyperliquidClientsProvider>
          <HyperliquidPageContent />
        </HyperliquidClientsProvider>
      </PageLayout>
    </>
  );
});

const pairSearchKeys = [{ name: 'name', weight: 1 }];
const pairKeyFn = (pair: TradePair) => pair.id;
const CellName = ({ option: { name, type } }: CellPartProps<TradePair>) => (
  <span>
    {name} ({capitalize(type)})
  </span>
);

interface Interval {
  value: CandleChartInterval;
  label: string;
}

const intervals: Interval[] = [
  { value: '1m', label: '1 minute' },
  { value: '3m', label: '3 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '4h', label: '4 hours' },
  { value: '8h', label: '8 hours' },
  { value: '12h', label: '12 hours' },
  { value: '1d', label: '1 day' },
  { value: '3d', label: '3 days' },
  { value: '1w', label: '1 week' },
  { value: '1M', label: '1 month' }
];
const intervalSearchKeys = [{ name: 'label', weight: 1 }];
const intervalKeyFn = (interval: Interval) => interval.value;
const IntervalName = ({ option: { label } }: CellPartProps<Interval>) => <span>{label}</span>;

const HyperliquidPageContent = memo(() => {
  const { tradePairs } = useTradePairs();
  const [selectedPair, setSelectedPair] = useState<TradePair>();
  const selectedPairWithDefault = selectedPair ?? tradePairs[0];
  const [selectedInterval, setSelectedInterval] = useState<Interval>();
  const selectedIntervalWithDefault = selectedInterval ?? intervals[5];

  const PairIcon = useCallback(
    ({ option }: CellPartProps<TradePair>) => (
      <img src={`https://app.hyperliquid.xyz/coins/${option.iconName}.svg`} className="w-4 h-4" />
    ),
    []
  );

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-4">
        <SelectWithModal
          title="Pair"
          testID={HyperliquidSelectors.pairSelect}
          CellIcon={PairIcon}
          ModalCellIcon={PairIcon}
          CellName={CellName}
          value={selectedPairWithDefault}
          className="flex-1"
          onSelect={setSelectedPair}
          options={tradePairs}
          searchKeys={pairSearchKeys}
          keyFn={pairKeyFn}
          itemTestID={HyperliquidSelectors.pairSelectItem}
        />
        <SelectWithModal
          title="Interval"
          testID={HyperliquidSelectors.intervalSelect}
          CellIcon={NullComponent}
          ModalCellIcon={NullComponent}
          CellName={IntervalName}
          value={selectedIntervalWithDefault}
          className="flex-1"
          onSelect={setSelectedInterval}
          options={intervals}
          searchKeys={intervalSearchKeys}
          keyFn={intervalKeyFn}
          itemTestID={HyperliquidSelectors.intervalSelectItem}
        />
      </div>
      <PriceChart coinName={selectedPairWithDefault.internalName} interval={selectedIntervalWithDefault.value} />
      <OrderBookView pair={selectedPairWithDefault} />
    </div>
  );
});
