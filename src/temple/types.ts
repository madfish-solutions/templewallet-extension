import type { StatusMessage } from '@lifi/sdk';
import BigNumber from 'bignumber.js';

import { StoredHDAccount } from 'lib/temple/types';

export enum TempleChainKind {
  Tezos = 'tezos',
  EVM = 'evm'
}

export const TempleChainTitle: Record<TempleChainKind, string> = {
  [TempleChainKind.Tezos]: 'Tezos',
  [TempleChainKind.EVM]: 'EVM'
};

export type AssetsAmounts = StringRecord<{ atomicAmount: BigNumber; isNft?: boolean }>;

export interface AdsViewerData {
  tezosAddress: string;
  evmAddress: string;
}

type AddressesKeys = 'tezosAddress' | 'evmAddress';
export type HDAccountRewardsAddresses = Pick<StoredHDAccount, AddressesKeys>;
export type NoAccountRewardsAddresses = Partial<Record<AddressesKeys, undefined>>;
export type RewardsAddresses = HDAccountRewardsAddresses | NoAccountRewardsAddresses;

export type PendingTransactionStatus = Exclude<StatusMessage, 'INVALID' | 'NOT_FOUND'>;
