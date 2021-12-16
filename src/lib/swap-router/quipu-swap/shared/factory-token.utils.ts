import { TokenInterface } from '../../token.interface';
import { QuipuSwapFactoryTokenType } from './factory-token.type';

export const quipuSwapFactoryTokenToTokenType = (token: QuipuSwapFactoryTokenType): TokenInterface => {
  if (typeof token === 'string') {
    return { address: token };
  } else {
    return { address: token[0], id: token[1] };
  }
};
