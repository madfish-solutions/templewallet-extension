import { BigNumber } from 'bignumber.js';

import { DexTypeEnum } from '../enum/dex-type.enum';

export interface RoutePair {
  dexType: DexTypeEnum;
  dexAddress: string;
  aTokenSlug: string;
  bTokenSlug: string;
  aTokenPool: BigNumber;
  bTokenPool: BigNumber;
}
