import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { groupBy, isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import {
  useRawEvmAccountBalancesSelector,
  useRawEvmChainAccountBalancesSelector
} from 'app/store/evm/balances/selectors';
import {
  useEvmBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useAllAccountBalancesSelector, useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import {
  useEnabledAccountChainTokensSlugs,
  useEnabledEvmAccountTokensSlugs,
  useEnabledEvmChainAccountTokensSlugs
} from 'lib/assets/hooks/tokens';
import {
  searchAssetsWithNoMeta,
  searchEvmAssetsWithNoMeta,
  searchEvmChainAssetsWithNoMeta,
  searchTezosAssetsWithNoMeta,
  searchTezosChainAssetsWithNoMeta
} from 'lib/assets/search.utils';
import {
  useAccountTokensSortPredicate,
  useEvmAccountTokensSortPredicate,
  useEvmChainTokensSortPredicate,
  useTezosAccountTokensSortPredicate,
  useTezosChainAccountTokensSortPredicate
} from 'lib/assets/use-sorting';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useGetChainTokenOrGasMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { EvmChain, TezosChain, useAllEvmChains, useAllTezosChains } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useEvmAssetsPaginationLogic } from './use-evm-assets-pagination-logic';

const getChainName = (chain?: TezosChain | EvmChain) => chain?.name ?? 'Unknown chain';

const getSlugWithChainId = <T>(chainSlug: string) => {
  const [_, chainId, assetSlug] = fromChainAssetSlug<T>(chainSlug);

  return { chainId, assetSlug };
};

const getSlugFromChainSlug = (chainSlug: string) => getSlugWithChainId(chainSlug).assetSlug;

export const useAccountTokensListingLogic = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  filterZeroBalances = false,
  groupByNetwork = false,
  leadingAssetsChainSlugs?: string[],
  leadingAssetsAreFilterable = false
) => {
  const chainTokensSlugs = useEnabledAccountChainTokensSlugs(accountTezAddress, accountEvmAddress);

  const tokensSortPredicate = useAccountTokensSortPredicate(accountTezAddress, accountEvmAddress);

  const tezAssetsAreLoading = useAreAssetsLoading('tokens');
  const tezMetadatasLoading = useTokensMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const evmMetadatasLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing =
    tezAssetsAreLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading || exchangeRatesLoading;

  const nonLeadingAssets = useMemo(
    () =>
      leadingAssetsChainSlugs?.length
        ? chainTokensSlugs.filter(slug => !leadingAssetsChainSlugs.includes(slug))
        : chainTokensSlugs,
    [chainTokensSlugs, leadingAssetsChainSlugs]
  );

  const tezBalances = useBalancesAtomicRecordSelector();
  const evmBalances = useRawEvmAccountBalancesSelector(accountEvmAddress);

  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();
  const evmMetadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

      const balance =
        chainKind === TempleChainKind.Tezos
          ? tezBalances[getKeyForBalancesRecord(accountTezAddress, chainId as string)]?.data[slug]
          : evmBalances[chainId as number]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [accountTezAddress, tezBalances, evmBalances]
  );

  const getTezMetadata = useGetTokenOrGasMetadata();

  const getEvmMetadata = useCallback(
    (chainId: number, slug: string) => {
      if (slug === EVM_TOKEN_SLUG) {
        return evmChains[chainId]?.currency;
      }

      return evmMetadata[chainId]?.[slug];
    },
    [evmChains, evmMetadata]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchAssetsWithNoMeta(
            searchValueDebounced,
            sourceArray,
            getTezMetadata,
            getEvmMetadata,
            slug => slug,
            getSlugFromChainSlug
          )
        : [...sourceArray].sort(tokensSortPredicate),
    [searchValueDebounced, sourceArray, getTezMetadata, getEvmMetadata, getSlugWithChainId, tokensSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssetsChainSlugs) || !leadingAssetsChainSlugs.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances
          ? leadingAssetsChainSlugs.filter(isNonZeroBalance)
          : leadingAssetsChainSlugs;

      const searchedLeadingSlugs = searchAssetsWithNoMeta(
        searchValueDebounced,
        filteredLeadingSlugs,
        getTezMetadata,
        getEvmMetadata,
        slug => slug,
        getSlugFromChainSlug
      );

      return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
    },
    [
      leadingAssetsChainSlugs,
      leadingAssetsAreFilterable,
      filterZeroBalances,
      isNonZeroBalance,
      searchedSlugs,
      searchValueDebounced,
      getTezMetadata,
      getEvmMetadata
    ],
    isEqual
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork) return filteredAssets;

    const chainNameSlugsRecord = groupBy(filteredAssets, chainSlug => {
      const [chainKind, chainId] = fromChainAssetSlug(chainSlug);

      return getChainName(
        chainKind === TempleChainKind.Tezos ? tezosChains[chainId as string] : evmChains[chainId as number]
      );
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [filteredAssets, groupByNetwork]);

  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(groupedAssets);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};

export const useTezosAccountTokensListingLogic = (
  publicKeyHash: string,
  chainSlugs: string[],
  filterZeroBalances = false,
  groupByNetwork = false,
  leadingAssets?: string[],
  leadingAssetsAreFilterable = false
) => {
  const nonLeadingAssets = useMemo(
    () => (leadingAssets?.length ? chainSlugs.filter(slug => !leadingAssets.includes(slug)) : chainSlugs),
    [chainSlugs, leadingAssets]
  );

  const tezosChains = useAllTezosChains();
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

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchTezosAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId)
        : [...sourceArray].sort(assetsSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId, assetsSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssets) || !leadingAssets.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

      const searchedLeadingSlugs = searchTezosAssetsWithNoMeta(
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
      getMetadata
    ],
    isEqual
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork) return filteredAssets;

    const chainNameSlugsRecord = groupBy(filteredAssets, chainSlug => {
      const [_, chainId] = fromChainAssetSlug<string>(chainSlug);

      return getChainName(tezosChains[chainId]);
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [filteredAssets, groupByNetwork]);

  return {
    filteredAssets: groupedAssets,
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
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, slug => slug)
        : [...sourceArray].sort(assetsSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, assetsSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssets) || !leadingAssets.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

      const searchedLeadingSlugs = searchTezosChainAssetsWithNoMeta(
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

export const useEvmAccountTokensListingLogic = (
  publicKeyHash: HexString,
  filterZeroBalances = false,
  groupByNetwork = false,
  leadingAssetsChainSlugs?: string[],
  leadingAssetsAreFilterable = false
) => {
  const chainSlugs = useEnabledEvmAccountTokensSlugs(publicKeyHash);

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const nonLeadingAssets = useMemo(
    () =>
      leadingAssetsChainSlugs?.length ? chainSlugs.filter(slug => !leadingAssetsChainSlugs.includes(slug)) : chainSlugs,
    [chainSlugs, leadingAssetsChainSlugs]
  );

  const evmChains = useAllEvmChains();
  const balances = useRawEvmAccountBalancesSelector(publicKeyHash);
  const metadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

      const balance = balances[chainId]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const getMetadata = useCallback(
    (chainId: number, slug: string) => {
      if (slug === EVM_TOKEN_SLUG) {
        return evmChains[chainId]?.currency;
      }

      return metadata[chainId]?.[slug];
    },
    [evmChains, metadata]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchEvmAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId)
        : [...sourceArray].sort(tokensSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId, tokensSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssetsChainSlugs) || !leadingAssetsChainSlugs.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances
          ? leadingAssetsChainSlugs.filter(isNonZeroBalance)
          : leadingAssetsChainSlugs;

      const searchedLeadingSlugs = searchEvmAssetsWithNoMeta(
        searchValueDebounced,
        filteredLeadingSlugs,
        getMetadata,
        getSlugWithChainId
      );

      return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
    },
    [
      leadingAssetsChainSlugs,
      leadingAssetsAreFilterable,
      filterZeroBalances,
      isNonZeroBalance,
      searchedSlugs,
      searchValueDebounced,
      getMetadata
    ],
    isEqual
  );

  const groupedAssets = useMemo(() => {
    if (!groupByNetwork) return filteredAssets;

    const chainNameSlugsRecord = groupBy(filteredAssets, chainSlug => {
      const [_, chainId] = fromChainAssetSlug<number>(chainSlug);

      return getChainName(evmChains[chainId]);
    });

    return Object.keys(chainNameSlugsRecord).reduce<string[]>(
      (acc, key) => acc.concat(key, chainNameSlugsRecord[key]),
      []
    );
  }, [filteredAssets, groupByNetwork]);

  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(groupedAssets);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};

export const useEvmChainAccountTokensListingLogic = (
  publicKeyHash: HexString,
  chainId: number,
  filterZeroBalances = false,
  leadingAssetsSlugs?: string[],
  leadingAssetsAreFilterable = false
) => {
  const tokenSlugs = useEnabledEvmChainAccountTokensSlugs(publicKeyHash, chainId);

  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const balancesLoading = useEvmBalancesLoadingSelector();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const isSyncing = balancesLoading || isMetadataLoading || exchangeRatesLoading;

  const nonLeadingAssets = useMemo(
    () => (leadingAssetsSlugs?.length ? tokenSlugs.filter(slug => !leadingAssetsSlugs.includes(slug)) : tokenSlugs),
    [tokenSlugs, leadingAssetsSlugs]
  );

  const chain = useEvmChainByChainId(chainId);
  const balances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);
  const metadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const getMetadata = useCallback(
    (slug: string) => {
      if (slug === EVM_TOKEN_SLUG) {
        return chain?.currency;
      }

      return metadata[chainId]?.[slug];
    },
    [chain, metadata, chainId]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchEvmChainAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, slug => slug)
        : [...sourceArray].sort(tokensSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, getSlugWithChainId, tokensSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssetsSlugs) || !leadingAssetsSlugs.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances
          ? leadingAssetsSlugs.filter(isNonZeroBalance)
          : leadingAssetsSlugs;

      const searchedLeadingSlugs = searchEvmChainAssetsWithNoMeta(
        searchValueDebounced,
        filteredLeadingSlugs,
        getMetadata,
        slug => slug
      );

      return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
    },
    [
      leadingAssetsSlugs,
      leadingAssetsAreFilterable,
      filterZeroBalances,
      isNonZeroBalance,
      searchedSlugs,
      searchValueDebounced,
      getMetadata
    ],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useEvmAssetsPaginationLogic(filteredAssets);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
