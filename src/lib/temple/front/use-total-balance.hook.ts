import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store';
import { useFiatCurrency } from 'lib/fiat-currency';

import { TEZ_TOKEN_SLUG, useDisplayedFungibleTokens } from './assets';
import { useAccount, useChainId } from './ready';
import { useSyncBalances } from './sync-balances';

/** Total fiat volume of displayed tokens */
export const useTotalBalance = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const { data: tokens } = useDisplayedFungibleTokens(chainId, publicKeyHash);

  const {
    fiatRates,
    selectedFiatCurrency: { name: selectedFiatCurrencyName }
  } = useFiatCurrency();

  const tokensBalances = useSyncBalances();
  const usdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);

  const fiatToUsdRate = useMemo(() => {
    if (fiatRates == null) return;

    const usdCurrency = fiatRates['usd'] ?? 1;
    return (fiatRates[selectedFiatCurrencyName.toLowerCase()] ?? 1) / usdCurrency;
  }, [fiatRates, selectedFiatCurrencyName]);

  const slugs = useMemo(
    () => (tokens ? [TEZ_TOKEN_SLUG, ...tokens.map(token => token.tokenSlug)] : [TEZ_TOKEN_SLUG]),
    [tokens]
  );

  const totalBalance = useMemo(() => {
    if (fiatToUsdRate == null) return new BigNumber(0);

    let dollarValue = new BigNumber(0);

    for (const slug of slugs) {
      const balance = tokensBalances[slug] || new BigNumber(0);
      const exchangeRate = new BigNumber(usdToTokenRates[slug] ? usdToTokenRates[slug] : 0);
      const tokenDollarValue = exchangeRate.times(balance);
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.times(fiatToUsdRate);
  }, [slugs, tokensBalances, usdToTokenRates, fiatToUsdRate]);

  return totalBalance;
};
