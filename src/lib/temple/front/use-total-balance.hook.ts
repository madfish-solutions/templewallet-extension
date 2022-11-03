import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { useFiatCurrency } from 'lib/fiat-currency';

import { toFloatBalance } from '../assets';
import { AssetMetadata } from '../metadata';
import { useGasToken, useAllTokensBaseMetadata } from './assets';
import { useSyncBalances } from './sync-balances';
import { useUSDPrices } from './usdprice';

export const useTotalBalance = () => {
  const metadataBySlags = useAvailableMetadata();
  const { fiatRates, selectedFiatCurrency } = useFiatCurrency();
  const safeFiatRates = fiatRates ?? {};
  const usdCurrency = safeFiatRates['usd'] ?? 1;
  const fiatToUsdRate = (safeFiatRates[selectedFiatCurrency.name.toLowerCase()] ?? 1) / usdCurrency;

  const exchangeRates = useUSDPrices();
  const rawBalances = useSyncBalances();

  const totalBalance = useMemo(() => {
    let dollarValue = new BigNumber(0);

    for (const tokenSlug in rawBalances) {
      const metadata: AssetMetadata | undefined = metadataBySlags[tokenSlug];
      if (metadata == null) continue;
      const rawBalance = rawBalances[tokenSlug];
      const floatBalance = toFloatBalance(rawBalance, metadata);
      const exchangeRate = new BigNumber(exchangeRates[tokenSlug] ? exchangeRates[tokenSlug] : 0);
      const tokenDollarValue = exchangeRate.times(floatBalance);
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.times(fiatToUsdRate);
  }, [exchangeRates, rawBalances, fiatToUsdRate, metadataBySlags]);

  return totalBalance.toFixed();
};

const useAvailableMetadata = () => {
  const { metadata: gasTokenMetadata } = useGasToken();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  return useMemo(
    (): Record<string, AssetMetadata> => ({ ...allTokensBaseMetadata, tez: gasTokenMetadata }),
    [allTokensBaseMetadata, gasTokenMetadata]
  );
};
