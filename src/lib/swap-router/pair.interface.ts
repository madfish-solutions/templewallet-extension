import { ContractAbstraction, ContractProvider } from '@taquito/taquito';

import { DexTypeEnum } from './dex-type.enum';
import { TokenInterface } from './token.interface';

export interface PairInterface {
  aToken: TokenInterface;
  bToken: TokenInterface;
  dexType: DexTypeEnum;
  dexContract: ContractAbstraction<ContractProvider>;
}
