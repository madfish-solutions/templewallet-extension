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
export type HDAccountAdsViewerAddresses = Pick<StoredHDAccount, AddressesKeys>;
export type NoAccountAdsViewerAddresses = Partial<Record<AddressesKeys, undefined>>;
export type AdsViewerAddresses = HDAccountAdsViewerAddresses | NoAccountAdsViewerAddresses;
