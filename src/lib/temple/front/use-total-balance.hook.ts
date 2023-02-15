import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store';
import { useFiatToUsdRate } from 'lib/fiat-currency';
import { isTruthy } from 'lib/utils';

import { TEZ_TOKEN_SLUG, useDisplayedFungibleTokens } from './assets';
import { useAccount, useChainId } from './ready';
import { useSyncBalances } from './sync-balances';

/** Total fiat volume of displayed tokens */
export const useTotalBalance = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const { data: tokens } = useDisplayedFungibleTokens(chainId, publicKeyHash);

  const tokensBalances = useSyncBalances();
  const allUsdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);

  const fiatToUsdRate = useFiatToUsdRate();

  const slugs = useMemo(
    () => (tokens ? [TEZ_TOKEN_SLUG, ...tokens.map(token => token.tokenSlug)] : [TEZ_TOKEN_SLUG]),
    [tokens]
  );

  const totalBalance = useMemo(() => {
    let dollarValue = new BigNumber(0);

    if (!isTruthy(fiatToUsdRate)) return dollarValue;

    for (const slug of slugs) {
      const balance = tokensBalances[slug];
      const usdToTokenRate = allUsdToTokenRates[slug];
      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : 0;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.times(fiatToUsdRate);
  }, [slugs, tokensBalances, allUsdToTokenRates, fiatToUsdRate]);

  return totalBalance;
};
