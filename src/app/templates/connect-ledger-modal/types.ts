import { DerivationType } from '@taquito/ledger-signer';
import BigNumber from 'bignumber.js';

import { TempleChainKind } from 'temple/types';

interface AccountPropsBase {
  chain: TempleChainKind;
  publicKey: string;
  address: string;
  index?: number;
  derivationPath: string;
}

export interface TezosAccountProps extends AccountPropsBase {
  chain: TempleChainKind.Tezos;
  balanceTez: BigNumber;
  derivationType: DerivationType;
}

export interface EvmAccountProps extends AccountPropsBase {
  chain: TempleChainKind.EVM;
  publicKey: HexString;
  address: HexString;
  balanceEth: BigNumber;
}

export type AccountProps = TezosAccountProps | EvmAccountProps;
