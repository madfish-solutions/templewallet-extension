import type BigNumber from 'bignumber.js';

import type { TEZ_TOKEN_SLUG } from './index';

interface Token {
  contract: string;
  id?: BigNumber.Value;
}

export interface FA2Token extends Token {
  id: BigNumber.Value;
}

export type Asset = Token | typeof TEZ_TOKEN_SLUG;

export type TokenStandardType = 'fa1.2' | 'fa2';

export enum AssetTypesEnum {
  Collectibles = 'collectibles',
  Tokens = 'tokens'
}
