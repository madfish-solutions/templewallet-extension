import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { useFiatCurrency } from 'lib/fiat-currency';

import { useSyncBalances } from './sync-balances';
import { useUSDPrices } from './usdprice';

export const useTotalBalance = () => {
  const { fiatRates, selectedFiatCurrency } = useFiatCurrency();
  const safeFiatRates = fiatRates ?? {};
  const usdCurrency = safeFiatRates['usd'] ?? 1;
  const fiatToUsdRate = (safeFiatRates[selectedFiatCurrency.name.toLowerCase()] ?? 1) / usdCurrency;

  const exchangeRates = useUSDPrices();
  const tokensBalances = useSyncBalances();

  const totalBalance = useMemo(() => {
    let dollarValue = new BigNumber(0);

    for (const tokenSlug of Object.keys(tokensBalances)) {
      const exchangeRate = new BigNumber(exchangeRates[tokenSlug] ? exchangeRates[tokenSlug] : 0);
      const tokenDollarValue = exchangeRate.times(tokensBalances[tokenSlug]);
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.times(fiatToUsdRate);
  }, [exchangeRates, tokensBalances, fiatToUsdRate]);

  return totalBalance.toFixed();
};
