import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';

import { useBalancesWithDecimals } from 'app/hooks/use-balances-with-decimals.hook';
import { useSelector } from 'app/store/root-state.selector';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokens } from 'lib/assets/hooks';
import { useFiatToUsdRate } from 'lib/fiat-currency';
import { isTruthy } from 'lib/utils';

import { useGasToken } from './assets';

/** Total fiat volume of displayed tokens */
export const useTotalBalance = () => {
  const tokens = useEnabledAccountTokens();
  const gasToken = useGasToken();

  const tokensBalances = useBalancesWithDecimals();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);

  const fiatToUsdRate = useFiatToUsdRate();

  const slugs = useMemo(
    () => (tokens ? [TEZ_TOKEN_SLUG, ...tokens.map(token => token.slug)] : [TEZ_TOKEN_SLUG]),
    [tokens]
  );

  const totalBalanceInDollar = useMemo(() => {
    let dollarValue = new BigNumber(0);

    for (const slug of slugs) {
      const balance = tokensBalances[slug];
      const usdToTokenRate = allUsdToTokenRates[slug];
      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : 0;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue;
  }, [slugs, tokensBalances, allUsdToTokenRates]);

  const totalBalanceInFiat = useMemo(() => {
    if (!isTruthy(fiatToUsdRate)) return new BigNumber(0);

    return totalBalanceInDollar.times(fiatToUsdRate);
  }, [totalBalanceInDollar, fiatToUsdRate]);

  const totalBalanceInGasToken = useMemo(() => {
    const tezosToUsdRate = allUsdToTokenRates[TEZ_TOKEN_SLUG];

    if (!isTruthy(tezosToUsdRate)) return new BigNumber(0);

    return totalBalanceInDollar.dividedBy(tezosToUsdRate).decimalPlaces(gasToken.metadata.decimals) || new BigNumber(0);
  }, [totalBalanceInDollar, allUsdToTokenRates, gasToken.metadata.decimals]);

  return { totalBalanceInFiat, totalBalanceInGasToken };
};
