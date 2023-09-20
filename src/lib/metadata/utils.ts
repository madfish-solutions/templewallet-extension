import { isDefined } from '@rnw-community/shared';
import { pick } from 'lodash';

import type { TokenMetadataResponse, WhitelistResponseToken } from 'lib/apis/temple';

import { TokenMetadata, TokenStandardsEnum } from './types';

export const buildTokenMetadataFromFetched = (
  token: TokenMetadataResponse | nullish,
  address: string,
  id: number
): TokenMetadata | null =>
  isDefined(token)
    ? {
        id,
        address,
        ...pick(token, ['decimals', 'thumbnailUri', 'displayUri', 'artifactUri']),
        // standard: token.standard === 'fa2' ? TokenStandardsEnum.Fa2 : TokenStandardsEnum.Fa12,
        symbol: token.symbol ?? token.name?.substring(0, 8) ?? '???',
        name: token.name ?? token.symbol ?? 'Unknown Token'
      }
    : null;

export const transformWhitelistToTokenMetadata = (
  token: WhitelistResponseToken,
  address: string,
  id: number
): TokenMetadata => ({
  id,
  address,
  decimals: token.metadata.decimals,
  symbol: token.metadata.symbol ?? token.metadata.name?.substring(0, 8) ?? '???',
  name: token.metadata.name ?? token.metadata.symbol ?? 'Unknown Token',
  thumbnailUri: token.metadata.thumbnailUri,
  standard: token.type === 'FA12' ? TokenStandardsEnum.Fa12 : TokenStandardsEnum.Fa2
});
