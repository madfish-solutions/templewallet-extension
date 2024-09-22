import { TempleChainKind } from 'temple/types';

export enum ActivityOperKindEnum {
  interaction,
  transferFrom,
  transferTo,
  transferFrom_ToAccount,
  transferTo_FromAccount,
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
  kind: ActivityOperKindEnum;
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
  kind: ActivityOperKindEnum;
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

export interface OperationMember {
  address: string;
  alias?: string;
}

export const InfinitySymbol = Symbol('Infinity');
