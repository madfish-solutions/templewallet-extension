import { BigMapAbstraction } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

export interface QuipuSwapFactoryStorage {
  counter: BigNumber;
  token_list: BigMapAbstraction;
  token_to_exchange: BigMapAbstraction;
}
