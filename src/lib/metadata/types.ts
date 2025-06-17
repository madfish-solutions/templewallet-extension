import type { RequiredBy } from 'viem';

import { TempleChainKind } from 'temple/types';

import { NftCollectionAttribute } from '../apis/temple/endpoints/evm/api.interfaces';
import { EVM_TOKEN_SLUG } from '../assets/defaults';
import { EvmAssetStandard } from '../evm/types';

export enum TezosTokenStandardsEnum {
  Fa2 = 'fa2',
  Fa12 = 'fa12'
}

export interface AssetMetadataBase {
  name: string;
  symbol: string;
  decimals: number;
  thumbnailUri?: string;
}

export interface TokenMetadata extends AssetMetadataBase {
  address: string;
  id: string;
  standard?: TezosTokenStandardsEnum;
  displayUri?: string;
  artifactUri?: string;
}

export type MetadataRecords = Record<string, TokenMetadata>;

/**
 * Maps are up to 2000 times faster to read from than arrays.
 * Be sure to convert to a serializible value before persisting.
 */
export type MetadataMap = Map<string, TokenMetadata>;

export interface EvmAssetMetadataBase {
  address: typeof EVM_TOKEN_SLUG | HexString;
  standard?: EvmAssetStandard;
  /** contract name (for nft contract refers to collection name) */
  name?: string;
  /** contract symbol (for nft contract refers to collection symbol) */
  symbol?: string;
  /** contract decimals (could be available only for ERC20 tokens and native currency) */
  decimals?: number;
  /** A fallback for icon URL */
  iconURL?: string;
}

export interface EvmTokenMetadata extends EvmAssetMetadataBase {
  standard: EvmAssetStandard.ERC20;
  address: HexString;
}

export interface EvmNativeTokenMetadata
  extends RequiredBy<EvmAssetMetadataBase, Exclude<keyof EvmAssetMetadataBase, 'iconURL'>> {
  standard: EvmAssetStandard.NATIVE;
  address: typeof EVM_TOKEN_SLUG;
}

export interface LifiEvmTokenMetadata extends EvmTokenMetadata {
  priceUSD: string;
  logoURI?: string;
}

export interface EvmCollectibleMetadata extends EvmAssetMetadataBase {
  standard?: EvmAssetStandard.ERC721 | EvmAssetStandard.ERC1155;
  address: HexString;
  tokenId: string;
  metadataUri?: string;
  image?: string;
  collectibleName?: string;
  description?: string;
  attributes?: NftCollectionAttribute[];
  externalUrl?: string;
  animationUrl?: string;
  originalOwner?: string;
}

export type EvmAssetMetadata = EvmTokenMetadata | EvmNativeTokenMetadata | EvmCollectibleMetadata;

export type ChainAssetMetadata<T extends TempleChainKind> = T extends TempleChainKind.EVM
  ? EvmAssetMetadata
  : AssetMetadataBase;

export type CollectibleMetadata<T extends TempleChainKind> = T extends TempleChainKind.EVM
  ? EvmCollectibleMetadata
  : TokenMetadata;
