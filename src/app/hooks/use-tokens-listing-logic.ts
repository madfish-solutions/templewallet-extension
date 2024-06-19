import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useAllAccountBalancesSelector, useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG, toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import {
  useEnabledAccountChainKindSlugs,
  useEnabledEvmAccountTokensSlugs,
  useEnabledEvmChainAccountTokensSlugs
} from 'lib/assets/hooks/tokens';
import { searchAssetsWithNoMeta, searchChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import {
  useAccountTokensSortPredicate,
  useEvmAccountTokensSortPredicate,
  useEvmChainTokensSortPredicate,
  useTezosAccountTokensSortPredicate,
  useTezosChainAccountTokensSortPredicate
} from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useEvmAssetsPaginationLogic } from './use-evm-assets-pagination-logic';

export const useAccountTokensListingLogic = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const chainKindSlugs = useEnabledAccountChainKindSlugs(accountTezAddress, accountEvmAddress);

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing =
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading;

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const sortedTokenSlugs = useMemoWithCompare(
    () => [
      ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
      ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
      ...chainKindSlugs.sort(tokensSortPredicate)
    ],
    [enabledTezChains, enabledEvmChains, chainKindSlugs, tokensSortPredicate],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(sortedTokenSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext
  };
};

export const useTezosAccountTokensListingLogic = (
  publicKeyHash: string,
  chainSlugs: string[],
  filterZeroBalances = false,
  leadingAssets?: string[],
  leadingAssetsAreFilterable = false
) => {
  const nonLeadingAssets = useMemo(
    () => (leadingAssets?.length ? chainSlugs.filter(slug => !leadingAssets.includes(slug)) : chainSlugs),
    [chainSlugs, leadingAssets]
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

  const sourceArray = useMemo(
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, String(tokenId)) : searchValue, 300);

  const assetsSortPredicate = useTezosAccountTokensSortPredicate(publicKeyHash);
  const getMetadata = useGetTokenOrGasMetadata();

  const getSlugWithChainId = useCallback((chainSlug: string) => {
    const [_, chainId, assetSlug] = fromChainAssetSlug<string>(chainSlug);

    return { chainId, assetSlug };
  }, []);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId)
        : [...sourceArray].sort(assetsSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId, assetsSortPredicate]
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
        getSlugWithChainId
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
      getMetadata,
      getSlugWithChainId
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

export const useTezosChainAccountTokensListingLogic = (
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

  const assetsSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, tezosChainId);
  const getMetadata = useGetChainTokenOrGasMetadata(tezosChainId);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchChainAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, slug => slug)
        : [...sourceArray].sort(assetsSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, assetsSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssets) || !leadingAssets.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

      const searchedLeadingSlugs = searchChainAssetsWithNoMeta(
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
  const chainSlugs = useEnabledEvmAccountTokensSlugs(publicKeyHash);

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const enabledChains = useEnabledEvmChains();

  const sortedTokenSlugs = useMemoWithCompare(
    () => [
      ...enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
      ...chainSlugs.sort(tokensSortPredicate)
    ],
    [enabledChains, chainSlugs, tokensSortPredicate],
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
