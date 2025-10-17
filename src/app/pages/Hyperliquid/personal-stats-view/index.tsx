import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Candle } from '@nktkas/hyperliquid';
import { uniq } from 'lodash';

import SegmentedControl from 'app/atoms/SegmentedControl';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useTypedSWR } from 'lib/swr';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAccountForEvm } from 'temple/front';

import { useAccountStates } from '../account-states-provider';
import { useClients } from '../clients';
import { subscriptionEffectFn } from '../subscription-effect-fn';
import { TradePair, isPerpTradePair, isSpotTradePair } from '../types';

import { BalancesView } from './balances-view';
import { FundingHistoryView } from './funding-history-view';
import { OrdersView } from './orders-view';
import { PositionsView } from './positions-view';
import { TradeHistoryView } from './trade-history-view';

type Tab = 'balances' | 'positions' | 'orders' | 'trade-history' | 'funding-history';

interface PersonalStatsViewProps {
  tradePairs: TradePair[];
}

export const PersonalStatsView = memo<PersonalStatsViewProps>(({ tradePairs }) => {
  const { accountStates } = useAccountStates();
  const evmAccount = useAccountForEvm();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const {
    clients: { exchange, subscription, info }
  } = useClients();
  const [activeTab, setActiveTab] = useState<Tab>('balances');
  const [lastPrices, setLastPrices] = useState<StringRecord>({});

  const getUserRateLimit = useCallback(
    async () =>
      evmAccount
        ? await info.userRateLimit({ user: evmAccount.address as HexString })
        : {
            cumVlm: '0.0',
            nRequestsUsed: 0,
            nRequestsCap: 10000
          },
    [evmAccount, info]
  );
  const { data: userRateLimit } = useTypedSWR(['hlUserRateLimit', evmAccount?.address], getUserRateLimit, {
    refreshInterval: 60000
  });

  const spotUsdcPairsByCoinIndex = useMemo(
    () =>
      Object.fromEntries(
        tradePairs
          .filter(isSpotTradePair)
          .filter(({ quoteToken }) => quoteToken.name === 'USDC')
          .map(x => [x.baseToken.index, x])
      ),
    [tradePairs]
  );
  const perpPairsByCoinName = useMemo(
    () => Object.fromEntries(tradePairs.filter(isPerpTradePair).map(x => [x.internalName, x])),
    [tradePairs]
  );

  const pairsForLastPrices = useMemoWithCompare(() => {
    if (!accountStates) return [];

    const { spotState, perpsState } = accountStates;
    const spotTokensIds = spotState.balances.filter(x => x.coin !== 'USDC').map(x => x.token);
    const perpTokensIds = uniq(perpsState.assetPositions.map(x => x.position.coin));

    return spotTokensIds
      .map(tokenId => spotUsdcPairsByCoinIndex[tokenId].internalName)
      .concat(perpTokensIds.map(coinName => perpPairsByCoinName[coinName].internalName));
  }, [perpPairsByCoinName, spotUsdcPairsByCoinIndex, accountStates]);
  const updateLastPrice = useCallback((pair: string, data: Candle) => {
    setLastPrices(prev => ({ ...prev, [pair]: data.c }));
  }, []);
  useEffect(() => {
    const cancelLastPricesSubFunctions = pairsForLastPrices.map(pair =>
      subscriptionEffectFn(() =>
        subscription.candle({ coin: pair, interval: '1h' }, data => updateLastPrice(pair, data))
      )
    );

    return () => cancelLastPricesSubFunctions.forEach(fn => fn());
  }, [pairsForLastPrices, subscription, testnetModeEnabled, updateLastPrice]);

  const balancesSegmentRef = useRef<HTMLDivElement>(null);
  const positionsSegmentRef = useRef<HTMLDivElement>(null);
  const ordersSegmentRef = useRef<HTMLDivElement>(null);
  const tradeHistorySegmentRef = useRef<HTMLDivElement>(null);
  const fundingHistorySegmentRef = useRef<HTMLDivElement>(null);
  const segments = useMemo(
    () => [
      {
        label: 'Balances',
        value: 'balances' as const,
        ref: balancesSegmentRef
      },
      {
        label: 'Positions',
        value: 'positions' as const,
        ref: positionsSegmentRef
      },
      {
        label: 'Orders',
        value: 'orders' as const,
        ref: ordersSegmentRef
      },
      {
        label: 'Trade history',
        value: 'trade-history' as const,
        ref: tradeHistorySegmentRef
      },
      {
        label: 'Funding history',
        value: 'funding-history' as const,
        ref: fundingHistorySegmentRef
      }
    ],
    []
  );

  if (!evmAccount || !exchange) {
    return <p className="text-font-description text-center">Switch to a wallet with EVM address</p>;
  }

  if (!accountStates || pairsForLastPrices.some(pair => !lastPrices[pair])) {
    return <p className="text-font-description text-center">Syncing data...</p>;
  }

  const { spotState, perpsState } = accountStates;

  return (
    <>
      <p className="text-font-description">
        {userRateLimit
          ? userRateLimit.nRequestsUsed >= userRateLimit.nRequestsCap
            ? 'At most 1 action per 10 seconds is allowed'
            : `${userRateLimit.nRequestsCap - userRateLimit.nRequestsUsed} actions left`
          : 'Loading rate limit...'}
      </p>

      <SegmentedControl<Tab>
        name="personal-stats-tab-switch"
        segments={segments}
        activeSegment={activeTab}
        setActiveSegment={setActiveTab}
      />

      {(() => {
        switch (activeTab) {
          case 'balances':
            return (
              <BalancesView
                spotState={spotState}
                perpsState={perpsState}
                spotUsdcPairsByCoinIndex={spotUsdcPairsByCoinIndex}
                lastPrices={lastPrices}
              />
            );
          case 'positions':
            return <PositionsView positions={perpsState.assetPositions} perpPairsByCoinName={perpPairsByCoinName} />;
          case 'orders':
            return <OrdersView />;
          case 'trade-history':
            return <TradeHistoryView />;
          default:
            return <FundingHistoryView />;
        }
      })()}
    </>
  );
});
