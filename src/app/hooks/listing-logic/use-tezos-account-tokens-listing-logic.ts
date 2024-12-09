import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getSlugWithChainId, useCommonAssetsListingLogic } from './utils';

export const useTezosAccountTokensForListing = (publicKeyHash: string, filterZeroBalances: boolean) => {
  const tokensSortPredicate = useTezosAccountTokensSortPredicate(publicKeyHash);

  const tokens = useTezosAccountTokens(publicKeyHash);

  const enabledStoredChainSlugs = useMemo(
    () =>
      tokens
        .filter(({ status }) => status === 'enabled')
        .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.Tezos, chainId, slug)),
    [tokens]
  );

  const enabledChains = useEnabledTezosChains();

  const gasSlugs = useMemo(
    () => enabledChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
    [enabledChains]
  );

  const balancesRecord = useBalancesAtomicRecordSelector();

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [_, chainId, assetSlug] = fromChainAssetSlug<string>(chainSlug);
      const key = getKeyForBalancesRecord(publicKeyHash, chainId);

      const balance = balancesRecord[key]?.data[assetSlug];
      return isDefined(balance) && balance !== '0';
    },
    [balancesRecord, publicKeyHash]
  );

  const enabledSlugsFiltered = useMemo(() => {
    const enabledSlugs = gasSlugs.concat(enabledStoredChainSlugs);

    return filterZeroBalances ? enabledSlugs.filter(isNonZeroBalance) : enabledSlugs;
  }, [enabledStoredChainSlugs, filterZeroBalances, gasSlugs, isNonZeroBalance]);

  const enabledChainsSlugsSorted = useMemoWithCompare(
    () => enabledSlugsFiltered.sort(tokensSortPredicate),
    [enabledSlugsFiltered, tokensSortPredicate]
  );

  return {
    enabledChainsSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useTezosAccountTokensListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    assetsAreLoading || metadatasLoading
  );

  const getMetadata = useGetTokenOrGasMetadata();

  const displayedSlugs = useMemoWithCompare(
    () =>
      isInSearchMode
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, getSlugWithChainId)
        : paginatedSlugs,
    [isInSearchMode, allSlugsSorted, paginatedSlugs, getMetadata, searchValueDebounced]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
