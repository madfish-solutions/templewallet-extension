import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TezosToolkit, WalletContract, ChainIds } from '@taquito/taquito';
import retry from 'async-retry';
import constate from 'constate';
import deepEqual from 'fast-deep-equal';
import Fuse from 'fuse.js';
import { useDebounce } from 'use-debounce';
import useForceUpdate from 'use-force-update';
import { browser } from 'webextension-polyfill-ts';

import { getMessage } from 'lib/i18n';
import { createQueue } from 'lib/queue';
import { useRetryableSWR } from 'lib/swr';
import {
  TokenStandard,
  isTezAsset,
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
  fetchCollectibleTokens,
  fetchAllKnownCollectibleTokenSlugs,
  AssetTypesEnum,
  isTokenDisplayed,
  toTokenSlug
} from 'lib/temple/assets';
import {
  AssetMetadata,
  fetchTokenMetadata,
  PRESERVED_TOKEN_METADATA,
  FILM_METADATA,
  TEZOS_METADATA,
  DetailedAssetMetdata
} from 'lib/temple/metadata';
import { ITokenStatus } from 'lib/temple/repo';

import { useTezos, useChainId, useNetwork, useAccount } from './ready';
import { onStorageChanged, putToStorage, usePassiveStorage } from './storage';

const ALL_TOKENS_BASE_METADATA_STORAGE_KEY = 'tokens_base_metadata';

export const useGasToken = () => {
  const network = useNetwork();

  return network.type === 'dcp'
    ? {
        logo: 'misc/token-logos/film.png',
        symbol: 'ф',
        assetName: 'FILM',
        metadata: FILM_METADATA,
        isDcpNetwork: true
      }
    : {
        logo: 'misc/token-logos/tez.svg',
        symbol: 'ꜩ',
        assetName: 'tez',
        metadata: TEZOS_METADATA
      };
};

export function useDisplayedFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(
    ['displayed-fungible-tokens', chainId, account],
    () => fetchDisplayedFungibleTokens(chainId, account),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 1_000
    }
  );
}

function useFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(['fungible-tokens', chainId, account], () => fetchFungibleTokens(chainId, account), {
    revalidateOnMount: true,
    refreshInterval: 20_000,
    dedupingInterval: 5_000
  });
}

export function useCollectibleTokens(chainId: string, account: string, isDisplayed: boolean) {
  return useRetryableSWR(
    ['collectible-tokens', chainId, account, isDisplayed],
    () => fetchCollectibleTokens(chainId, account, isDisplayed),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 5_000
    }
  );
}

function useAllKnownFungibleTokenSlugs(chainId: string) {
  return useRetryableSWR(['all-known-fungible-token-slugs', chainId], () => fetchAllKnownFungibleTokenSlugs(chainId), {
    revalidateOnMount: true,
    refreshInterval: 60_000,
    dedupingInterval: 10_000
  });
}

function useAllKnownCollectibleTokenSlugs(chainId: string) {
  return useRetryableSWR(
    ['all-known-collectible-token-slugs', chainId],
    () => fetchAllKnownCollectibleTokenSlugs(chainId),
    {
      revalidateOnMount: true,
      refreshInterval: 60_000,
      dedupingInterval: 10_000
    }
  );
}

const enqueueAutoFetchMetadata = createQueue();
const autoFetchMetadataFails = new Set<string>();

export function useAssetMetadata(slug: string) {
  const tezos = useTezos();
  const forceUpdate = useForceUpdate();
  const { metadata } = useGasToken();

  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata } =
    useTokensMetadata();

  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        if (!deepEqual(newValue[slug], allTokensBaseMetadataRef.current[slug])) {
          forceUpdate();
        }
      }),
    [slug, allTokensBaseMetadataRef, forceUpdate]
  );

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = allTokensBaseMetadataRef.current[slug] ?? null;
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist && !autoFetchMetadataFails.has(slug)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(slug))
        .then(metadata =>
          Promise.all([
            setTokensBaseMetadata({ [slug]: metadata.base }),
            setTokensDetailedMetadata({ [slug]: metadata.detailed })
          ])
        )
        .catch(() => autoFetchMetadataFails.add(slug));
    }
  }, [slug, exist, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata]);

  // Tezos
  if (tezAsset) {
    return metadata;
  }

  // Preserved for legacy tokens
  if (!exist && PRESERVED_TOKEN_METADATA.has(slug)) {
    return PRESERVED_TOKEN_METADATA.get(slug)!;
  }

  return tokenMetadata;
}

const defaultAllTokensBaseMetadata = {};
const enqueueSetAllTokensBaseMetadata = createQueue();

export const [TokensMetadataProvider, useTokensMetadata] = constate(() => {
  const [initialAllTokensBaseMetadata] = usePassiveStorage<Record<string, AssetMetadata>>(
    ALL_TOKENS_BASE_METADATA_STORAGE_KEY,
    defaultAllTokensBaseMetadata
  );

  const allTokensBaseMetadataRef = useRef(initialAllTokensBaseMetadata);
  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        allTokensBaseMetadataRef.current = newValue;
      }),
    []
  );

  const tezos = useTezos();
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  const fetchMetadata = useCallback((slug: string) => fetchTokenMetadata(tezosRef.current, slug), []);

  const setTokensBaseMetadata = useCallback(
    (toSet: Record<string, AssetMetadata>) =>
      enqueueSetAllTokensBaseMetadata(() =>
        putToStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, {
          ...allTokensBaseMetadataRef.current,
          ...toSet
        })
      ),
    []
  );

  const setTokensDetailedMetadata = useCallback(
    (toSet: Record<string, DetailedAssetMetdata>) =>
      browser.storage.local.set(mapObjectKeys(toSet, getDetailedMetadataStorageKey)),
    []
  );

  return {
    allTokensBaseMetadataRef,
    fetchMetadata,
    setTokensBaseMetadata,
    setTokensDetailedMetadata
  };
});

export const useGetTokenMetadata = () => {
  const { allTokensBaseMetadataRef } = useTokensMetadata();
  const { metadata } = useGasToken();

  return useCallback(
    (slug: string) => {
      if (isTezAsset(slug)) {
        return metadata;
      }

      return allTokensBaseMetadataRef.current[slug];
    },
    [allTokensBaseMetadataRef, metadata]
  );
};

export function useAllTokensBaseMetadata() {
  const { allTokensBaseMetadataRef } = useTokensMetadata();
  const forceUpdate = useForceUpdate();

  useEffect(() => onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, forceUpdate), [forceUpdate]);

  return allTokensBaseMetadataRef.current;
}

type TokenStatuses = Record<string, { displayed: boolean; removed: boolean }>;

export const useAvailableAssets = (assetType: AssetTypesEnum) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const { data: allCollectiblesSlugs = [], isValidating: allKnownCollectiblesTokenSlugsLoading } =
    useAllKnownCollectibleTokenSlugs(chainId);
  const {
    data: collectibles = [],
    mutate: mutateCollectibles,
    isValidating: collectibleTokensLoading
  } = useCollectibleTokens(chainId, account.publicKeyHash, false);

  const { data: allTokenSlugs = [], isValidating: allKnownFungibleTokenSlugsLoading } =
    useAllKnownFungibleTokenSlugs(chainId);
  const {
    data: tokens = [],
    mutate: mutateTokens,
    isValidating: fungibleTokensLoading
  } = useFungibleTokens(chainId, account.publicKeyHash);

  const isCollectibles = assetType === AssetTypesEnum.Collectibles;
  const assets = isCollectibles ? collectibles : tokens;
  const slugs = isCollectibles ? allCollectiblesSlugs : allTokenSlugs;
  const mutate = isCollectibles ? mutateCollectibles : mutateTokens;

  const isLoading =
    allKnownFungibleTokenSlugsLoading ||
    fungibleTokensLoading ||
    allKnownCollectiblesTokenSlugsLoading ||
    collectibleTokensLoading;

  const assetsStatuses = useMemo(() => {
    const statuses: TokenStatuses = {};
    for (const asset of assets) {
      statuses[asset.tokenSlug] = {
        displayed: isTokenDisplayed(asset),
        removed: asset.status === ITokenStatus.Removed
      };
    }
    return statuses;
  }, [assets]);

  const availableAssets = useMemo(
    () => slugs.filter(slug => slug in allTokensBaseMetadata && !assetsStatuses[slug]?.removed),
    [slugs, allTokensBaseMetadata, assetsStatuses]
  );

  return { availableAssets, assetsStatuses, isLoading, mutate };
};

export function searchAssets(
  searchValue: string,
  assetSlugs: string[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) {
  if (!searchValue) return assetSlugs;

  const fuse = new Fuse(
    assetSlugs.map(slug => ({
      slug,
      metadata: isTezAsset(slug) ? TEZOS_METADATA : allTokensBaseMetadata[slug]
    })),
    {
      keys: [
        { name: 'metadata.name', weight: 0.9 },
        { name: 'metadata.symbol', weight: 0.7 },
        { name: 'slug', weight: 0.3 }
      ],
      threshold: 1
    }
  );

  return fuse.search(searchValue).map(({ item: { slug } }) => slug);
}

export function useFilteredAssets(assetSlugs: string[]) {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assetSlugs, allTokensBaseMetadata),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
}

const STUB_TEZOS_ADDRESS = 'tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw';

export class NotMatchingStandardError extends Error {}

export class IncorrectTokenIdError extends NotMatchingStandardError {}

export async function assertGetBalance(
  tezos: TezosToolkit,
  contract: WalletContract,
  standard: TokenStandard,
  fa2TokenId = 0
) {
  const chainId = (await tezos.rpc.getChainId()) as ChainIds;

  try {
    await retry(
      () =>
        standard === 'fa2'
          ? contract.views.balance_of([{ owner: STUB_TEZOS_ADDRESS, token_id: fa2TokenId }]).read(chainId)
          : contract.views.getBalance(STUB_TEZOS_ADDRESS).read(chainId),
      { retries: 3, minTimeout: 0, maxTimeout: 0 }
    );
  } catch (err: any) {
    if (err?.value?.string === 'FA2_TOKEN_UNDEFINED') {
      throw new IncorrectTokenIdError(getMessage('incorrectTokenIdErrorMessage'));
    } else {
      throw new Error(
        getMessage('unknownErrorCheckingSomeEntrypoint', standard === 'fa2' ? 'balance_of' : 'getBalance')
      );
    }
  }
}

function getDetailedMetadataStorageKey(slug: string) {
  return `detailed_asset_metadata_${slug}`;
}

function mapObjectKeys<T extends Record<string, any>>(obj: T, predicate: (key: string) => string): T {
  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    newObj[predicate(key)] = obj[key];
  }

  return newObj as T;
}
