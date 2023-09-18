import { isDefined } from '@rnw-community/shared';
import { pick } from 'lodash';

import type { TokenMetadataResponse } from 'lib/apis/temple';

import type { TokenMetadata } from './types';

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
