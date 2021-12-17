import { ContractAbstraction, ContractProvider } from '@taquito/taquito';

import { DexTypeEnum } from '../enums/dex-type.enum';

export interface DexPairInterface {
  dexType: DexTypeEnum;
  dexContract: ContractAbstraction<ContractProvider>;
  aTokenSlug: string;
  bTokenSlug: string;
}
