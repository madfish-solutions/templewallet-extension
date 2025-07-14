import { useCallback } from 'react';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import {
  makeUseChainKindAccountTokensForListing,
  makeUseChainKindAccountTokensListingLogic
} from './make-use-chain-kind-account-tokens-listing-logic';
import { useIsBigBalance } from './use-is-big-balance';

const useIsTezosBigBalance = (publicKeyHash: string) => {
  const getBalanceWithDecimals = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);
  const tezosUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const getBalance = useCallback(
    (chainSlug: string) => {
      const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

      return getBalanceWithDecimals(chainId, assetSlug);
    },
    [getBalanceWithDecimals]
  );
  const getUsdToTokenRate = useCallback(
    (chainSlug: string) => {
      const [, , assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

      return tezosUsdToTokenRates?.[assetSlug];
    },
    [tezosUsdToTokenRates]
  );
  return useIsBigBalance(getBalance, getUsdToTokenRate);
};

export const useTezosAccountTokensForListing = makeUseChainKindAccountTokensForListing<TempleChainKind.Tezos>({
  useAccountTokens: useTezosAccountTokens,
  useEnabledChains: useEnabledTezosChains,
  useTokensSortPredicate: useTezosAccountTokensSortPredicate,
  useIsBigBalance: useIsTezosBigBalance,
  chainKind: TempleChainKind.Tezos,
  gasTokenSlug: TEZ_TOKEN_SLUG
});

export const useTezosAccountTokensListingLogic = makeUseChainKindAccountTokensListingLogic<TempleChainKind.Tezos>({
  useBalancesAreLoading: () => useAreAssetsLoading('tokens'),
  useIsMetadataLoading: useTokensMetadataLoadingSelector,
  useExchangeRatesLoading: () => false,
  useGetTokenOrGasMetadata,
  searchTokensWithNoMeta: searchTezosAssetsWithNoMeta
});
