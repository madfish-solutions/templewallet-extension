import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store/root-state.selector';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledAccountTokensSlugs } from 'lib/assets/hooks';
import { useGetCurrentAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { useFiatToUsdRate } from 'lib/fiat-currency';
import { useGasTokenMetadata } from 'lib/metadata';
import { isTruthy } from 'lib/utils';

/** Total fiat volume of displayed tokens */
export const useTotalBalance = () => {
  const tokensSlugs = useEnabledAccountTokensSlugs();
  const gasMetadata = useGasTokenMetadata();

  const getBalance = useGetCurrentAccountTokenOrGasBalanceWithDecimals();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);

  const fiatToUsdRate = useFiatToUsdRate();

  const slugs = useMemo(() => [TEZ_TOKEN_SLUG, ...tokensSlugs], [tokensSlugs]);

  const totalBalanceInDollar = useMemo(() => {
    let dollarValue = new BigNumber(0);

    for (const slug of slugs) {
      const balance = getBalance(slug);
      const usdToTokenRate = allUsdToTokenRates[slug];
      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : 0;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue;
  }, [slugs, getBalance, allUsdToTokenRates]);

  const totalBalanceInFiat = useMemo(() => {
    if (!isTruthy(fiatToUsdRate)) return new BigNumber(0);

    return totalBalanceInDollar.times(fiatToUsdRate);
  }, [totalBalanceInDollar, fiatToUsdRate]);

  const totalBalanceInGasToken = useMemo(() => {
    const tezosToUsdRate = allUsdToTokenRates[TEZ_TOKEN_SLUG];

    if (!isTruthy(tezosToUsdRate)) return new BigNumber(0);

    return totalBalanceInDollar.dividedBy(tezosToUsdRate).decimalPlaces(gasMetadata.decimals) || new BigNumber(0);
  }, [totalBalanceInDollar, allUsdToTokenRates, gasMetadata.decimals]);

  return { totalBalanceInFiat, totalBalanceInGasToken };
};
