import BigNumber from 'bignumber.js';

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
