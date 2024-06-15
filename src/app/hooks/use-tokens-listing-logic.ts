import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import {
  useEvmAccountTokensSortPredicate,
  useEvmChainTokensSortPredicate,
  useTezosTokensSortPredicate
} from 'lib/assets/use-sorting';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useEnabledEvmAccountTokensSlugs, useEnabledEvmChainAccountTokensSlugs } from '../../lib/assets/hooks/tokens';
import { toChainAssetSlug } from '../../lib/assets/utils';
import { useEnabledEvmChains } from '../../temple/front';
import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from '../store/evm/selectors';

import { useEvmAssetsPaginationLogic } from './use-evm-assets-pagination-logic';

export const useTezosTokensListingLogic = (
  tezosChainId: string,
  publicKeyHash: string,
  assetsSlugs: string[],
  filterZeroBalances = false,
  leadingAssets?: string[],
  leadingAssetsAreFilterable = false
) => {
  const nonLeadingAssets = useMemo(
    () => (leadingAssets?.length ? assetsSlugs.filter(slug => !leadingAssets.includes(slug)) : assetsSlugs),
    [assetsSlugs, leadingAssets]
  );

  const balances = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);
  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, String(tokenId)) : searchValue, 300);

  const assetsSortPredicate = useTezosTokensSortPredicate(publicKeyHash, tezosChainId);
  const getMetadata = useGetTokenOrGasMetadata(tezosChainId);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, slug => slug)
        : [...sourceArray].sort(assetsSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, assetsSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssets) || !leadingAssets.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

      const searchedLeadingSlugs = searchAssetsWithNoMeta(
        searchValueDebounced,
        filteredLeadingSlugs,
        getMetadata,
        slug => slug
      );

      return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
    },
    [
      leadingAssets,
      leadingAssetsAreFilterable,
      filterZeroBalances,
      isNonZeroBalance,
      searchedSlugs,
      searchValueDebounced,
      getMetadata
    ],
    isEqual
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
};

export const useEvmAccountTokensListingLogic = (publicKeyHash: HexString) => {
  const chainTokenSlugs = useEnabledEvmAccountTokensSlugs(publicKeyHash);

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const enabledChains = useEnabledEvmChains();

  const sortedTokenSlugs = useMemoWithCompare(
    () => [
      ...enabledChains.map(chain => toChainAssetSlug(chain.chainId, EVM_TOKEN_SLUG)),
      ...chainTokenSlugs.sort(tokensSortPredicate)
    ],
    [enabledChains, chainTokenSlugs, tokensSortPredicate],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(sortedTokenSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};

export const useEvmChainAccountTokensListingLogic = (publicKeyHash: HexString, chainId: number) => {
  const tokenSlugs = useEnabledEvmChainAccountTokensSlugs(publicKeyHash, chainId);

  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const sortedTokenSlugs = useMemoWithCompare(
    () => [EVM_TOKEN_SLUG, ...tokenSlugs.sort(tokensSortPredicate)],
    [tokenSlugs, tokensSortPredicate],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(sortedTokenSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};
