import { useMemo } from 'react';

import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { calculateTotalDollarValue } from './utils';

export const useEvmAccountTotalBalance = (publicKeyHash: HexString) => {
  const enabledChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  const enabledChains = useEnabledEvmChains();

  const chainSlugs = useMemo(
    () => [
      ...enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
      ...enabledChainSlugs
    ],
    [enabledChainSlugs, enabledChains]
  );

  return useMemo(
    () =>
      calculateTotalDollarValue(
        chainSlugs,
        chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

          return getBalance(chainId, slug);
        },
        chainSlug => {
          const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

          return usdToTokenRates[chainId]?.[slug];
        }
      ),
    [chainSlugs, getBalance, usdToTokenRates]
  );
};
