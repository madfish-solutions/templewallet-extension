import { pick } from 'lodash';

import type { TokenMetadataResponse, WhitelistResponseToken } from 'lib/apis/temple';

import { TokenMetadata, TokenStandardsEnum } from './types';

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
