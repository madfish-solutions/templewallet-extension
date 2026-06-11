import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import {
  makeUseChainKindAccountTokensForListing,
  makeUseChainKindAccountTokensListingLogic
} from './make-use-chain-kind-account-tokens-listing-logic';
import { useIsTezosBigBalance } from './use-is-big-balance';

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
