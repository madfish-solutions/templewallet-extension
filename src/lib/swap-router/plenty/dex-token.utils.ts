import { BigNumber } from 'bignumber.js';

import { TokenInterface } from '../token.interface';

export const plentyDexTokenToTokenType = (
  tokenAddress: string,
  tokenCheck: boolean,
  tokenId: BigNumber
): TokenInterface => {
  if (tokenCheck) {
    return { address: tokenAddress, id: tokenId };
  } else {
    return { address: tokenAddress };
  }
};
