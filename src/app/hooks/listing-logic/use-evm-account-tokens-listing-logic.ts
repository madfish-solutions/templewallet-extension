import { useCallback } from 'react';

import { useEvmTokensExchangeRatesLoading, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals } from 'lib/balances/hooks';
import { useGetEvmGasOrTokenMetadata } from 'lib/metadata';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import {
  makeUseChainKindAccountTokensForListing,
  makeUseChainKindAccountTokensListingLogic
} from './make-use-chain-kind-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { useIsBigBalance } from './use-is-big-balance';

const useIsEvmBigBalance = (publicKeyHash: HexString): ((chainSlug: string) => boolean) => {
  const getBalanceWithDecimals = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const getBalance = useCallback(
    (chainSlug: string) => {
      const [, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

      return getBalanceWithDecimals(chainId, slug);
    },
    [getBalanceWithDecimals]
  );
  const getUsdToTokenRate = useCallback(
    (chainSlug: string) => {
      const [, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

      return evmUsdToTokenRates[chainId]?.[slug];
    },
    [evmUsdToTokenRates]
  );

  return useIsBigBalance(getBalance, getUsdToTokenRate);
};

export const useEvmAccountTokensForListing = makeUseChainKindAccountTokensForListing<TempleChainKind.EVM>({
  useAccountTokens: useEvmAccountTokens,
  useEnabledChains: useEnabledEvmChains,
  useTokensSortPredicate: useEvmAccountTokensSortPredicate,
  useIsBigBalance: useIsEvmBigBalance,
  chainKind: TempleChainKind.EVM,
  gasTokenSlug: EVM_TOKEN_SLUG
});

export const useEvmAccountTokensListingLogic = makeUseChainKindAccountTokensListingLogic<TempleChainKind.EVM>({
  useBalancesAreLoading: useEvmBalancesAreLoading,
  useIsMetadataLoading: useEvmTokensMetadataLoadingSelector,
  useExchangeRatesLoading: useEvmTokensExchangeRatesLoading,
  useGetTokenOrGasMetadata: useGetEvmGasOrTokenMetadata,
  searchTokensWithNoMeta: searchEvmTokensWithNoMeta
});
