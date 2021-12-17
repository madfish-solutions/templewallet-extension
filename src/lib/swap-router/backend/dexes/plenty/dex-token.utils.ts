import { BigNumber } from 'bignumber.js';

import { toTokenSlug } from '../../utils/asset.utils';

export const plentyDexTokenToTokenSlug = (tokenAddress: string, tokenCheck: boolean, tokenId: BigNumber) =>
  tokenCheck ? toTokenSlug(tokenAddress, tokenId) : toTokenSlug(tokenAddress);
