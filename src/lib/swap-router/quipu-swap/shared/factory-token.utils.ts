import { TokenType } from '../../token.type';
import { QuipuSwapFactoryTokenType } from './factory-token.type';

export const quipuSwapFactoryTokenToTokenType = (token: QuipuSwapFactoryTokenType): TokenType => {
  if (typeof token === 'string') {
    return { address: token };
  } else {
    return { address: token[0], id: token[1] };
  }
};
