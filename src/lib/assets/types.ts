import type { StoredAssetStatus } from 'app/store/assets/state';

import type { TEZ_TOKEN_SLUG } from './index';

export interface AccountAsset {
  slug: string;
  status: StoredAssetStatus;
}

interface Token {
  contract: string;
  id?: string;
}

export interface FA2Token extends Token {
  id: string;
}

export type Asset = Token | typeof TEZ_TOKEN_SLUG;

export type TokenStandardType = 'fa1.2' | 'fa2';

export enum AssetTypesEnum {
  Collectibles = 'collectibles',
  Tokens = 'tokens'
}
