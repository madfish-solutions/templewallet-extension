import { AssetMetadataBase } from 'lib/metadata';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { TempleChainKind } from '../../temple/types';
import { EvmCollectibleMetadata, EvmTokenMetadata } from '../metadata/types';

import { fromAssetSlug, fromChainAssetSlug } from './utils';

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
    Number.isInteger(Number(searchValue))
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
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
    Number.isInteger(Number(searchValue))
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
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
  getChainMetadata: (chainId: number, slug: string) => EvmTokenMetadata | undefined,
  getSlugWithChainId: (asset: T) => { chainId: number; assetSlug: string }
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlugWithChainId(asset).assetSlug.startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
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
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 },
          { name: 'contractName', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contractName', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
    asset => {
      const { chainId, assetSlug } = getSlugWithChainId(asset);
      const [contract, tokenId] = fromAssetSlug(assetSlug);
      const metadata = getChainMetadata(chainId, assetSlug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.collectibleName,
        contractName: metadata?.name
      };
    }
  );
}

export function searchAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  getTezMetadata: (chainId: string, slug: string) => AssetMetadataBase | undefined,
  getEvmMetadata: (chainId: number, slug: string) => EvmTokenMetadata | undefined,
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
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
    asset => {
      const chainSlug = getChainSlug(asset);

      const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);
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
  getMetadata: (slug: string) => EvmTokenMetadata | undefined,
  getSlug: (asset: T) => string
) {
  const trimmedSearchValue = searchValue.trim();

  if (trimmedSearchValue.search(/^[A-Za-z0-9]+_\d*$/) === 0)
    return assets.filter(asset => getSlug(asset).startsWith(trimmedSearchValue));

  return searchAndFilterItems(
    assets,
    searchValue,
    Number.isInteger(Number(searchValue)) && !searchValue.startsWith('0x')
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
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
      ? [
          { name: 'tokenId', weight: 1 },
          { name: 'symbol', weight: 0.75 },
          { name: 'name', weight: 0.5 },
          { name: 'contractName', weight: 0.5 }
        ]
      : [
          { name: 'symbol', weight: 1 },
          { name: 'name', weight: 0.5 },
          { name: 'contractName', weight: 0.5 },
          { name: 'contract', weight: 0.1 }
        ],
    asset => {
      const slug = getSlug(asset);
      const [contract, tokenId] = fromAssetSlug(slug);
      const metadata = getMetadata(slug);

      return {
        contract,
        tokenId,
        symbol: metadata?.symbol,
        name: metadata?.collectibleName,
        contractName: metadata?.name
      };
    }
  );
}
