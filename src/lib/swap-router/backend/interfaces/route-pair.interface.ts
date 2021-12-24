import { BigNumber } from 'bignumber.js';

import { DexTypeEnum } from '../enums/dex-type.enum';

export interface RoutePairInterface {
  dexType: DexTypeEnum;
  dexAddress: string;
  aTokenSlug: string;
  bTokenSlug: string;
  aTokenPool: BigNumber;
  bTokenPool: BigNumber;
}
