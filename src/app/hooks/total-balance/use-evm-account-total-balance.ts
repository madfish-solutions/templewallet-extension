import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledEvmAccountTokenSlugs } from 'lib/assets/hooks';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useIsEvmBigBalance } from '../listing-logic/use-is-big-balance';

import { calculateTotalDollarValue as genericCalculateTotalDollarValue } from './utils';

const useCalculateTotalDollarValue = (publicKeyHash: HexString) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return (chainSlugs: string[]) =>
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
    );
};

export const useGetEvmChainAccountTotalBalance = (publicKeyHash: HexString, ignoreSmallBalances = false) => {
  const enabledChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const calculateTotalDollarValue = useCalculateTotalDollarValue(publicKeyHash);
  const isBigBalance = useIsEvmBigBalance(publicKeyHash);

  return (chainId: number) =>
    calculateTotalDollarValue(
      enabledChainSlugs
        .filter(slug => {
          const [, id] = parseChainAssetSlug(slug, TempleChainKind.EVM);
          return id === chainId;
        })
        .concat(toChainAssetSlug(TempleChainKind.EVM, chainId, EVM_TOKEN_SLUG))
        .filter(slug => !ignoreSmallBalances || isBigBalance(slug))
    );
};

export const useEvmAccountTotalBalance = (publicKeyHash: HexString, ignoreSmallBalances = false) => {
  const enabledChainSlugs = useEnabledEvmAccountTokenSlugs(publicKeyHash);

  const calculateTotalDollarValue = useCalculateTotalDollarValue(publicKeyHash);
  const isBigBalance = useIsEvmBigBalance(publicKeyHash);
  const enabledChains = useEnabledEvmChains();

  const chainSlugs = useMemoWithCompare(
    () =>
      enabledChains
        .map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG))
        .concat(enabledChainSlugs)
        .filter(slug => !ignoreSmallBalances || isBigBalance(slug)),
    [enabledChainSlugs, enabledChains, ignoreSmallBalances, isBigBalance]
  );

  return calculateTotalDollarValue(chainSlugs);
};
