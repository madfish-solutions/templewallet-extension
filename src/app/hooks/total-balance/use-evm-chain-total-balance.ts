import { useMemo } from 'react';

import { useEvmChainUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmChainAccountTokenSlugs } from 'lib/assets/hooks';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';

import { calculateTotalDollarValue } from './utils';

export const useEvmChainTotalBalance = (publicKeyHash: HexString, chainId: number) => {
  const tokenSlugs = useEnabledEvmChainAccountTokenSlugs(publicKeyHash, chainId);

  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);

  const slugs = useMemo(() => [EVM_TOKEN_SLUG, ...tokenSlugs], [tokenSlugs]);

  return useMemo(
    () =>
      calculateTotalDollarValue(
        slugs,
        slug => getBalance(chainId, slug),
        slug => usdToTokenRates[slug]
      ),
    [slugs, getBalance, chainId, usdToTokenRates]
  );
};
