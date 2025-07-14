import { useCallback, useMemo } from 'react';

import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { calculateTotalDollarValue as genericCalculateTotalDollarValue } from './utils';

const useCalculateTotalDollarValue = (publicKeyHash: HexString) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (chainSlugs: string[]) =>
      genericCalculateTotalDollarValue(
        chainSlugs,
        chainSlug => {
          const [, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

          return getBalance(chainId, slug);
        },
        chainSlug => {
          const [, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

          return usdToTokenRates[chainId]?.[slug];
        }
      ),
    [getBalance, usdToTokenRates]
  );
};

export const useGetEvmChainAccountTotalBalance = (publicKeyHash: HexString) => {
  const enabledChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const calculateTotalDollarValue = useCalculateTotalDollarValue(publicKeyHash);

  return useCallback(
    (chainId: number) =>
      calculateTotalDollarValue(
        enabledChainSlugs
          .filter(slug => {
            const [, id] = parseChainAssetSlug(slug, TempleChainKind.EVM);
            return id === chainId;
          })
          .concat(toChainAssetSlug(TempleChainKind.EVM, chainId, EVM_TOKEN_SLUG))
      ),
    [calculateTotalDollarValue, enabledChainSlugs]
  );
};

export const useEvmAccountTotalBalance = (publicKeyHash: HexString) => {
  const enabledChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const calculateTotalDollarValue = useCalculateTotalDollarValue(publicKeyHash);

  const enabledChains = useEnabledEvmChains();

  const chainSlugs = useMemo(
    () => [
      ...enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
      ...enabledChainSlugs
    ],
    [enabledChainSlugs, enabledChains]
  );

  return useMemo(() => calculateTotalDollarValue(chainSlugs), [calculateTotalDollarValue, chainSlugs]);
};
