import { useEvmTokensExchangeRatesLoading, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetEvmGasOrTokenMetadata } from 'lib/metadata';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import {
  makeUseChainKindAccountTokensForListing,
  makeUseChainKindAccountTokensListingLogic
} from './make-use-chain-kind-account-tokens-listing-logic';
import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { useIsEvmBigBalance } from './use-is-big-balance';

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
