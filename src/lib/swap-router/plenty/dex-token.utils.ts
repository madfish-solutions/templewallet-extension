import { BigNumber } from 'bignumber.js';

import { TokenType } from '../token.type';

export const plentyDexTokenToTokenType = (tokenAddress: string, tokenCheck: boolean, tokenId: BigNumber): TokenType => {
  if (tokenCheck) {
    return { address: tokenAddress, id: tokenId };
  } else {
    return { address: tokenAddress };
  }
};
