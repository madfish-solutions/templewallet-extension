import { isString, pick } from 'lodash';

import type { TokenMetadataResponse, WhitelistResponseToken } from 'lib/apis/temple';
import { TEZOS_SYMBOL } from 'lib/assets';

import { AssetMetadataBase, TokenMetadata, TokenStandardsEnum } from './types';

export function getAssetSymbol(metadata: AssetMetadataBase | nullish, short = false) {
  if (!metadata) return '???';
  if (!short) return metadata.symbol;
  return metadata.symbol === 'tez' ? TEZOS_SYMBOL : metadata.symbol.substring(0, 5);
}

export function getAssetName(metadata: AssetMetadataBase | nullish) {
  return metadata ? metadata.name : 'Unknown Token';
}

/** Empty string for `artifactUri` counts */
export const isCollectible = (metadata: StringRecord<any>) =>
  'artifactUri' in metadata && isString(metadata.artifactUri);

/**
 * @deprecated // Assertion here is not safe!
 */
export const isCollectibleTokenMetadata = (metadata: AssetMetadataBase): metadata is TokenMetadata =>
  isCollectible(metadata);

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
  symbol: metadata.symbol ?? metadata.name?.substring(0, 8) ?? '???',
  name: metadata.name ?? metadata.symbol ?? 'Unknown Token',
  thumbnailUri: metadata.thumbnailUri,
  standard: type === 'FA12' ? TokenStandardsEnum.Fa12 : TokenStandardsEnum.Fa2
});
