import { DerivationType } from '@taquito/ledger-signer';
import BigNumber from 'bignumber.js';

export interface TezosAccountProps {
  pk: string;
  pkh: string;
  balanceTez: BigNumber;
  derivationIndex: number;
  derivationType: DerivationType;
}
