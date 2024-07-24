import { useMemo } from 'react';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useGetTezosChainAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { calculateTotalDollarValue } from './utils';

export const useTezosTotalBalance = (publicKeyHash: string) => {
  const tokensSlugs = useEnabledTezosChainAccountTokenSlugs(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);

  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, TEZOS_MAINNET_CHAIN_ID);
  const allUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const slugs = useMemo(() => [TEZ_TOKEN_SLUG, ...tokensSlugs], [tokensSlugs]);

  return useMemo(
    () =>
      calculateTotalDollarValue(
        slugs,
        slug => getBalance(slug),
        slug => allUsdToTokenRates[slug]
      ),
    [slugs, getBalance, allUsdToTokenRates]
  );
};
