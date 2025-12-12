import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { use3RouteEvmTokenMetadataSelector } from 'app/store/evm/swap-3route-metadata/selectors';
import { useLifiEvmTokenMetadataSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useSelector } from 'app/store/root-state.selector';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useStorage } from 'lib/temple/front';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';
import { TempleChainKind } from 'temple/types';

import { FIAT_CURRENCIES_BASE } from './consts';
import type { CoingeckoFiatInterface, FiatCurrencyOptionBase } from './types';

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

export function useAssetUSDPrice(slug: string, chainId: number | string, evm = false) {
  const tezosUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const processedSlug = slug === EVM_TOKEN_SLUG ? toChainAssetSlug(TempleChainKind.EVM, chainId, slug) : slug;
  const lifiUsdToTokenRate = useLifiEvmTokenMetadataSelector(chainId as number, processedSlug)?.priceUSD;
  const route3EvmUsdToTokenRate = use3RouteEvmTokenMetadataSelector(chainId as number, processedSlug)?.priceUSD;

  return useMemo(() => {
    let rate: number | string;

    if (evm && typeof chainId === 'number') {
      rate = evmUsdToTokenRates[chainId]?.[slug] ?? lifiUsdToTokenRate ?? route3EvmUsdToTokenRate;
    } else {
      rate = tezosUsdToTokenRates[slug];
    }

    return rate === undefined ? undefined : Number(rate);
  }, [evm, chainId, evmUsdToTokenRates, slug, tezosUsdToTokenRates, lifiUsdToTokenRate, route3EvmUsdToTokenRate]);
}

export const useFiatToUsdRate = () => {
  const {
    fiatRates,
    selectedFiatCurrency: { name: selectedFiatCurrencyName }
  } = useFiatCurrency();

  return useMemo(() => {
    if (!isDefined(fiatRates)) return;

    const fiatRate = fiatRates[selectedFiatCurrencyName.toLowerCase()] ?? 1;
    const usdRate = fiatRates.usd ?? 1;

    return fiatRate / usdRate;
  }, [fiatRates, selectedFiatCurrencyName]);
};

export function useAssetFiatCurrencyPrice(slug: string, chainId: number | string, evm = false): BigNumber {
  const fiatToUsdRate = useFiatToUsdRate();
  const usdToTokenRate = useAssetUSDPrice(slug, chainId, evm);

  return useMemo(() => {
    if (!isTruthy(usdToTokenRate) || !isTruthy(fiatToUsdRate)) return ZERO;

    return BigNumber(fiatToUsdRate).times(usdToTokenRate);
  }, [fiatToUsdRate, usdToTokenRate]);
}

export const useFiatCurrency = () => {
  const { data } = useSelector(state => state.currency.fiatToTezosRates);

  const [selectedFiatCurrency, setSelectedFiatCurrency] = useStorage<FiatCurrencyOptionBase>(
    FIAT_CURRENCY_STORAGE_KEY,
    FIAT_CURRENCIES_BASE[0]
  );

  return {
    selectedFiatCurrency,
    setSelectedFiatCurrency,
    fiatRates: data
  };
};

const coingeckoApi = axios.create({ baseURL: 'https://api.coingecko.com/api/v3/' });

export const fetchFiatToTezosRates = () =>
  coingeckoApi
    .get<CoingeckoFiatInterface>(
      `/simple/price?ids=tezos&vs_currencies=${FIAT_CURRENCIES_BASE.map(({ apiLabel }) => apiLabel).join(',')}`
    )
    .then(({ data }) => {
      const mappedRates: Record<string, number> = {};
      const tezosData = Object.keys(data.tezos);

      for (const quote of tezosData) {
        mappedRates[quote] = data.tezos[quote];
      }

      return mappedRates;
    });
