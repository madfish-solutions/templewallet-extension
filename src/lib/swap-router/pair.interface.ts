import { ContractAbstraction, ContractProvider } from '@taquito/taquito';

import { DexTypeEnum } from './dex-type.enum';
import { TokenType } from './token.type';

export interface PairInterface {
  aToken: TokenType;
  bToken: TokenType;
  dexType: DexTypeEnum;
  dexContract: ContractAbstraction<ContractProvider>;
}
