import { AssetMetadataBase } from 'lib/metadata';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { TempleChainKind } from '../../temple/types';
import { EvmAssetMetadataBase, EvmCollectibleMetadata } from '../metadata/types';

import { fromAssetSlug, parseChainAssetSlug } from './utils';

const DEFAULT_NUMBER_SEARCH_PRESET = [
  { name: 'tokenId' as const, weight: 1 },
  { name: 'symbol' as const, weight: 0.75 },
  { name: 'name' as const, weight: 0.5 }
];

const DEFAULT_STRING_SEARCH_PRESET = [
  { name: 'symbol' as const, weight: 1 },
  { name: 'name' as const, weight: 0.5 },
  { name: 'contract' as const, weight: 0.1 }
];

export function searchTezosChainAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getMetadata: (slug: string) => AssetMetadataBase | undefined,
  getSlug: (asset: T) => string
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) ? DEFAULT_NUMBER_SEARCH_PRESET : DEFAULT_STRING_SEARCH_PRESET,
    asset => {
      const slug = getSlug(asset);
      const [contract, tokenId] = fromAssetSlug(slug);
      const metadata = getMetadata(slug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.name
      };
    }
  );
}

export function searchTezosAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getChainMetadata: (chainId: string, slug: string) => AssetMetadataBase | undefined,
  getSlugWithChainId: (asset: T) => { chainId: string; assetSlug: string }
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlugWithChainId(asset).assetSlug.startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) ? DEFAULT_NUMBER_SEARCH_PRESET : DEFAULT_STRING_SEARCH_PRESET,
    asset => {
      const { chainId, assetSlug } = getSlugWithChainId(asset);
      const [contract, tokenId] = fromAssetSlug(assetSlug);
      const metadata = getChainMetadata(chainId, assetSlug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.name
      };
    }
  );
}

export function searchEvmTokensWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getChainMetadata: (chainId: number, slug: string) => EvmAssetMetadataBase | undefined,
  getSlugWithChainId: (asset: T) => { chainId: number; assetSlug: string }
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlugWithChainId(asset).assetSlug.startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? DEFAULT_NUMBER_SEARCH_PRESET
      : DEFAULT_STRING_SEARCH_PRESET,
    asset => {
      const { chainId, assetSlug } = getSlugWithChainId(asset);
      const [contract, tokenId] = fromAssetSlug(assetSlug);
      const metadata = getChainMetadata(chainId, assetSlug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.name
      };
    }
  );
}

export function searchAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getTezMetadata: (chainId: string, slug: string) => AssetMetadataBase | undefined,
  getEvmMetadata: (chainId: number, slug: string) => EvmAssetMetadataBase | undefined,
  getChainSlug: (asset: T) => string,
  getSlug: (asset: T) => string
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? DEFAULT_NUMBER_SEARCH_PRESET
      : DEFAULT_STRING_SEARCH_PRESET,
    asset => {
      const chainSlug = getChainSlug(asset);

      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);
      const [contract, tokenId] = fromAssetSlug(slug);
      const metadata =
        chainKind === TempleChainKind.Tezos
          ? getTezMetadata(chainId as string, slug)
          : getEvmMetadata(chainId as number, slug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.name
      };
    }
  );
}

export function searchEvmChainTokensWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getMetadata: (slug: string) => EvmAssetMetadataBase | undefined,
  getSlug: (asset: T) => string
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? DEFAULT_NUMBER_SEARCH_PRESET
      : DEFAULT_STRING_SEARCH_PRESET,
    asset => {
      const slug = getSlug(asset);
      const [contract, tokenId] = fromAssetSlug(slug);
      const metadata = getMetadata(slug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.name
      };
    }
  );
}

const COLLECTIBLES_NUMBER_SEARCH_PRESET = [
  { name: 'tokenId' as const, weight: 1 },
  { name: 'name' as const, weight: 0.5 },
  { name: 'contractName' as const, weight: 0.5 }
];

const COLLECTIBLES_STRING_SEARCH_PRESET = [
  { name: 'name' as const, weight: 1 },
  { name: 'contractName' as const, weight: 1 },
  { name: 'contract' as const, weight: 0.2 }
];

interface SearchCollectiblesWithNoMetaInput<T> {
  searchValue: string;
  assets: T[];
  getTezMetadata: (chainId: string, slug: string) => AssetMetadataBase | undefined;
  getEvmMetadata: (chainId: number, slug: string) => EvmCollectibleMetadata | undefined;
  getSlug: (asset: T) => string;
  getChainSlug: (asset: T) => string;
  getTezCollectionName: (chainId: string, slug: string) => string | undefined;
}

export function searchCollectiblesWithNoMeta<T>({
  searchValue,
  assets,
  getTezMetadata,
  getEvmMetadata,
  getSlug,
  getChainSlug,
  getTezCollectionName
}: SearchCollectiblesWithNoMetaInput<T>) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? COLLECTIBLES_NUMBER_SEARCH_PRESET
      : COLLECTIBLES_STRING_SEARCH_PRESET,
    asset => {
      const chainSlug = getChainSlug(asset);

      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);
      const [contract, tokenId] = fromAssetSlug(slug);
      const commonProps = { contract, tokenId };

      if (chainKind === TempleChainKind.Tezos) {
        const metadata = getTezMetadata(chainId as string, slug);

        return {
          ...commonProps,
          name: metadata?.name,
          contractName: getTezCollectionName(chainId as string, slug)
        };
      }

      const metadata = getEvmMetadata(chainId as number, slug);

      return {
        ...commonProps,
        name: metadata?.collectibleName,
        contractName: metadata?.name
      };
    }
  );
}

export function searchEvmCollectiblesWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getChainMetadata: (chainId: number, slug: string) => EvmCollectibleMetadata | undefined,
  getSlugWithChainId: (asset: T) => { chainId: number; assetSlug: string }
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlugWithChainId(asset).assetSlug.startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? COLLECTIBLES_NUMBER_SEARCH_PRESET
      : COLLECTIBLES_STRING_SEARCH_PRESET,
    asset => {
      const { chainId, assetSlug } = getSlugWithChainId(asset);
      const [contract, tokenId] = fromAssetSlug(assetSlug);
      const metadata = getChainMetadata(chainId, assetSlug);

      return {
        contract,
        tokenId,
        name: metadata?.collectibleName,
        contractName: metadata?.name
      };
    }
  );
}

export function searchEvmChainCollectiblesWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getMetadata: (slug: string) => EvmCollectibleMetadata | undefined,
  getSlug: (asset: T) => string
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? COLLECTIBLES_NUMBER_SEARCH_PRESET
      : COLLECTIBLES_STRING_SEARCH_PRESET,
    asset => {
      const slug = getSlug(asset);
      const [contract, tokenId] = fromAssetSlug(slug);
      const metadata = getMetadata(slug);

      return {
        contract,
        tokenId,
        name: metadata?.collectibleName,
        contractName: metadata?.name
      };
    }
  );
}
