import { useCallback, useEffect, useMemo, useState } from 'react';

import { WsWebData2 } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';

import { useTypedSWR } from 'lib/swr';
import { ONE_HOUR_MS } from 'lib/utils/numbers';

import { useClients } from './clients';
import { TradePair } from './types';
import { coinsNamesByNetworkType, getDisplayCoinName } from './utils';

export const useTradePairs = () => {
  const {
    clients: { info },
    networkType,
    addWebData2Listener,
    removeWebData2Listener
  } = useClients();

  const fetchTradePairsInput = useCallback(async () => {
    const [spotMetaAndCtxs, perpMetaAndCtxs] = await Promise.all([
      info.spotMetaAndAssetCtxs(),
      info.metaAndAssetCtxs()
    ]);
    const [{ universe: spotUniverses, tokens: spotTokens }, spotCtxs] = spotMetaAndCtxs;
    const [{ universe: perpUniverses }, perpCtxs] = perpMetaAndCtxs;

    return { spotUniverses, spotTokens, spotCtxs, perpUniverses, perpCtxs };
  }, [info]);

  const { data: fetchedTradePairsInput } = useTypedSWR(['hyperliquid-trade-pairs', networkType], fetchTradePairsInput, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    refreshInterval: ONE_HOUR_MS
  });
  const [tradePairsInput, setTradePairsInput] = useState(fetchedTradePairsInput);
  const tradePairsAreLoaded = !!tradePairsInput;

  useEffect(() => setTradePairsInput(fetchedTradePairsInput), [fetchedTradePairsInput]);

  useEffect(() => {
    if (!tradePairsAreLoaded) return;

    const webData2Listener = ({ assetCtxs: perpCtxs, spotAssetCtxs: spotCtxs, meta: perpMeta }: WsWebData2) => {
      const { universe: perpUniverses } = perpMeta;

      setTradePairsInput(
        prevInput =>
          prevInput && {
            ...prevInput,
            spotCtxs,
            perpUniverses,
            perpCtxs
          }
      );
    };

    addWebData2Listener(webData2Listener);

    return () => removeWebData2Listener(webData2Listener);
  }, [tradePairsAreLoaded, addWebData2Listener, removeWebData2Listener]);

  const tradePairs = useMemo(() => {
    if (!tradePairsInput) return [];

    const coinsNames = coinsNamesByNetworkType[networkType];
    const { spotUniverses, spotTokens, spotCtxs, perpUniverses, perpCtxs } = tradePairsInput;
    const spotCtxsByCoin = Object.fromEntries(spotCtxs.map(ctx => [ctx.coin, ctx]));
    const coinsWithPerpsNames = new Set(perpUniverses.map(u => u.name));

    return spotUniverses
      .map(({ name, tokens, index }): TradePair => {
        const baseToken = spotTokens[tokens[0]];
        const quoteToken = spotTokens[tokens[1]];
        const { prevDayPx, markPx, dayNtlVlm, midPx } = spotCtxsByCoin[name];

        return {
          id: 10000 + index,
          index,
          internalName: name,
          iconName: baseToken.name.startsWith('k')
            ? baseToken.name.slice(1)
            : coinsWithPerpsNames.has(baseToken.name)
            ? getDisplayCoinName(baseToken.name, networkType)
            : `${getDisplayCoinName(baseToken.name, networkType)}_${getDisplayCoinName(quoteToken.name, networkType)}`,
          name: `${getDisplayCoinName(baseToken.name, networkType)}/${getDisplayCoinName(
            quoteToken.name,
            networkType
          )}`,
          baseToken: { ...baseToken, displayName: coinsNames[baseToken.name] ?? baseToken.name },
          quoteToken: { ...quoteToken, displayName: coinsNames[quoteToken.name] ?? quoteToken.name },
          prevDayPx,
          markPx,
          midPx: midPx ?? markPx,
          dayNtlVlm: new BigNumber(dayNtlVlm).decimalPlaces(2).toNumber(),
          type: 'spot'
        };
      })
      .concat(
        perpUniverses
          .map(({ name, szDecimals, maxLeverage, isDelisted }, index) => {
            const { funding, prevDayPx, markPx, midPx, dayNtlVlm } = perpCtxs[index];

            return {
              id: index,
              index,
              internalName: name,
              isDelisted,
              iconName: name.startsWith('k') ? name.slice(1) : name,
              name: `${name}-USD`,
              prevDayPx,
              markPx,
              midPx: midPx ?? markPx,
              dayNtlVlm: new BigNumber(dayNtlVlm).decimalPlaces(2).toNumber(),
              type: 'perp' as const,
              fundingRate: funding,
              szDecimals,
              maxLeverage
            };
          })
          .filter(({ isDelisted }) => !isDelisted)
      )
      .sort((a, b) => b.dayNtlVlm - a.dayNtlVlm);
  }, [tradePairsInput, networkType]);

  return { tradePairs, networkType };
};
