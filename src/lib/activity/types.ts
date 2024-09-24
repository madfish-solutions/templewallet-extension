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

interface ChainActivityBase {
  chain: TempleChainKind;
  hash: string;
  /** Original, not filtered number of operations */
  operationsCount: number;
}

export interface TezosActivity extends ChainActivityBase {
  chain: TempleChainKind.Tezos;
  chainId: string;
  blockExplorerUrl?: string;
  operations: TezosOperation[];
}

export interface TezosOperation {
  kind: ActivityOperKindEnum;
  asset?: TezosActivityAsset;
}

export interface TezosActivityAsset extends ActivityAssetBase {}

export interface EvmActivity extends ChainActivityBase {
  chain: TempleChainKind.EVM;
  chainId: number;
  blockExplorerUrl?: string;
  operations: EvmOperation[];
}

export interface EvmOperation {
  kind: ActivityOperKindEnum;
  asset?: EvmActivityAsset;
}

export interface EvmActivityAsset extends ActivityAssetBase {
  iconURL?: string;
}

interface ActivityAssetBase {
  contract: string;
  tokenId?: string;
  /** Signed (with `-` if applicable) */
  amount?: string | typeof InfinitySymbol; // TODO: Try without symbol
  decimals: number;
  nft?: boolean;
  symbol?: string;
}

export interface OperationMember {
  address: string;
  alias?: string;
}

export const InfinitySymbol = Symbol('Infinity');
