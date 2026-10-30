import { isDefined } from '@rnw-community/shared';
import { isString, pick } from 'lodash';

import type { TokenMetadataResponse, WhitelistResponseToken } from 'lib/apis/temple';
import { TEZOS_SYMBOL } from 'lib/assets';
import { t } from 'lib/i18n';

import {
  AssetMetadataBase,
  TokenMetadata,
  TezosTokenStandardsEnum,
  EvmCollectibleMetadata,
  EvmAssetMetadataBase,
  EvmAssetMetadata
} from './types';

export function getAssetSymbol(metadata: EvmAssetMetadataBase | AssetMetadataBase | nullish, short = false) {
  if (!metadata?.symbol) return '???';
  if (!short) return metadata.symbol;

  return metadata.symbol === 'tez' ? TEZOS_SYMBOL : metadata.symbol.substring(0, 5);
}

export function getTokenName(metadata: EvmAssetMetadataBase | AssetMetadataBase | nullish) {
  return metadata?.name || 'Unknown Token';
}

export function getCollectibleName(metadata: EvmCollectibleMetadata | nullish) {
  return metadata?.collectibleName || 'Unknown Collectible';
}

export function getCollectionName(metadata: EvmCollectibleMetadata | nullish) {
  return metadata?.name || t('unknownCollection');
}

const RETIRED_SEADN_HOST = '://i.seadn.io/';
const RETIRED_SEADN_GAE_ID = /https?:\/\/i\.seadn\.io\/gae\/([a-z0-9_-]+)/i;
const REQUESTED_IMAGE_WIDTH = /(?:width=|[?&]w=)(\d{2,4})/;

/** True for image URLs on the retired OpenSea host `i.seadn.io`. */
const isRetiredSeadnImageUrl = (url: string): boolean => url.includes(RETIRED_SEADN_HOST);

/**
 * `i.seadn.io` no longer resolves. `/gae/{id}` objects are still served by Google, including when a
 * Covalent image proxy wraps that URL. Returns `undefined` when the URL is on that host and cannot be rewritten.
 */
export const patchRetiredSeadnImageUrl = (url: string): string | undefined => {
  const id = RETIRED_SEADN_GAE_ID.exec(url)?.[1];
  if (!id) return isRetiredSeadnImageUrl(url) ? undefined : url;

  const width = REQUESTED_IMAGE_WIDTH.exec(url)?.[1];

  return `https://lh3.googleusercontent.com/${id}${width ? `=s${width}` : ''}`;
};

/** Empty string for `artifactUri` counts */
export const isCollectible = (metadata?: StringRecord<any>) =>
  isDefined(metadata) && 'artifactUri' in metadata && isString(metadata.artifactUri);

export const isEvmCollectible = (metadata?: EvmAssetMetadata): metadata is EvmCollectibleMetadata =>
  isDefined(metadata) && 'tokenId' in metadata;

export const isTezosCollectibleMetadata = (metadata: AssetMetadataBase): metadata is TokenMetadata =>
  'address' in metadata &&
  isString(metadata.address) &&
  'id' in metadata &&
  isString(metadata.id) &&
  isCollectible(metadata);

export const isEvmCollectibleMetadata = (metadata: EvmAssetMetadataBase): metadata is EvmCollectibleMetadata =>
  'tokenId' in metadata;

export const buildTokenMetadataFromFetched = (
  token: TokenMetadataResponse,
  address: string,
  id: string
): TokenMetadata => ({
  address,
  id,
  ...pick(token, ['decimals', 'thumbnailUri', 'displayUri', 'artifactUri']),
  symbol: token.symbol ?? token.name?.substring(0, 8) ?? '???',
  name: token.name ?? token.symbol ?? 'Unknown Token'
});

export const buildTokenMetadataFromWhitelist = ({
  contractAddress,
  fa2TokenId,
  type,
  metadata
}: WhitelistResponseToken): TokenMetadata => ({
  address: contractAddress,
  id: fa2TokenId ? String(fa2TokenId) : '0',
  decimals: metadata.decimals,
  symbol: metadata.symbol ?? metadata.name.substring(0, 8) ?? '???',
  name: metadata.name ?? metadata.symbol ?? 'Unknown Token',
  thumbnailUri: metadata.thumbnailUri,
  standard: type === 'FA12' ? TezosTokenStandardsEnum.Fa12 : TezosTokenStandardsEnum.Fa2
});
