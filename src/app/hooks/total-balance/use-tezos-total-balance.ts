import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useGetTezosChainAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

export const useTezosTotalBalance = (publicKeyHash: string) => {
  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);
  const allUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const slugs = useMemo(() => [TEZ_TOKEN_SLUG, ...tokensSlugs], [tokensSlugs]);

  return useMemo(() => {
    let dollarValue = ZERO;

    for (const slug of slugs) {
      const balance = getBalance(slug);
      const usdToTokenRate = allUsdToTokenRates[slug];
      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : ZERO;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.toString();
  }, [slugs, getBalance, allUsdToTokenRates]);
};
