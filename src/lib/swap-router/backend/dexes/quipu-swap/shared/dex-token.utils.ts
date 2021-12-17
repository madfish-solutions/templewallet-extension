import { toTokenSlug } from '../../../utils/asset.utils';
import { QuipuSwapDexTokenType } from './dex-token.type';

export const quipuSwapDexTokenToTokenSlug = (token: QuipuSwapDexTokenType) =>
  typeof token === 'string' ? toTokenSlug(token) : toTokenSlug(token[0], token[1]);
