import { TempleChainKind } from 'temple/types';

export enum ActivityKindEnum {
  interaction,
  send,
  receive,
  swap,
  approve
}

export type Activity = TezosActivity | EvmActivity;

export interface TezosActivity {
  chain: TempleChainKind.Tezos;
  chainId: string;
  hash: string;
  blockExplorerUrl?: string;
  operations: TezosOperation[];
}

export interface TezosOperation {
  kind: ActivityKindEnum;
  asset?: TezosActivityAsset;
}

export interface TezosActivityAsset {
  contract: string;
  tokenId?: string;
  amount?: string | typeof InfinitySymbol;
  decimals: number;
  nft?: boolean;
  symbol?: string;
  iconURL?: string;
}

export interface EvmActivity {
  chain: TempleChainKind.EVM;
  chainId: number;
  hash: string;
  blockExplorerUrl?: string;
  operations: EvmOperation[];
}

export interface EvmOperation {
  kind: ActivityKindEnum;
  asset?: EvmActivityAsset;
}

export interface EvmActivityAsset {
  contract: string;
  tokenId?: string;
  amount?: string | typeof InfinitySymbol;
  decimals: number;
  nft?: boolean;
  symbol?: string;
  iconURL?: string;
}

export const InfinitySymbol = Symbol('Infinity');
