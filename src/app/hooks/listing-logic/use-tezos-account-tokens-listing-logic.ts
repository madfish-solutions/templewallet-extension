import { useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import {
  makeUseChainKindAccountTokensForListing,
  makeUseChainKindAccountTokensListingLogic
} from './make-use-chain-kind-account-tokens-listing-logic';

const useIsNonZeroBalance = (publicKeyHash: string) => {
  const balancesRecord = useBalancesAtomicRecordSelector();

  return useCallback(
    (chainSlug: string) => {
      const [_, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);
      const key = getKeyForBalancesRecord(publicKeyHash, chainId);

      const balance = balancesRecord[key]?.data[assetSlug];
      return isDefined(balance) && balance !== '0';
    },
    [balancesRecord, publicKeyHash]
  );
};

export const useTezosAccountTokensForListing = makeUseChainKindAccountTokensForListing<TempleChainKind.Tezos>({
  useAccountTokens: useTezosAccountTokens,
  useEnabledChains: useEnabledTezosChains,
  useTokensSortPredicate: useTezosAccountTokensSortPredicate,
  useIsNonZeroBalance,
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
