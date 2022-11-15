import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store';
import { useFiatCurrency } from 'lib/fiat-currency';

import { useSyncBalances } from './sync-balances';

export const useTotalBalance = () => {
  const {
    fiatRates,
    selectedFiatCurrency: { name: selectedFiatCurrencyName }
  } = useFiatCurrency();

  const exchangeRates = useSelector(state => state.currency.usdToTokenRates.data);
  const tokensBalances = useSyncBalances();

  const totalBalance = useMemo(() => {
    if (fiatRates == null) return new BigNumber(0);

    const usdCurrency = fiatRates['usd'] ?? 1;
    const fiatToUsdRate = (fiatRates[selectedFiatCurrencyName.toLowerCase()] ?? 1) / usdCurrency;

    let dollarValue = new BigNumber(0);

    for (const tokenSlug of Object.keys(tokensBalances)) {
      const exchangeRate = new BigNumber(exchangeRates[tokenSlug] ? exchangeRates[tokenSlug] : 0);
      const tokenDollarValue = exchangeRate.times(tokensBalances[tokenSlug]);
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.times(fiatToUsdRate);
  }, [exchangeRates, tokensBalances, fiatRates, selectedFiatCurrencyName]);

  return totalBalance.toFixed();
};
