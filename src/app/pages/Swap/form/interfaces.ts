import { LiFiStep } from '@lifi/sdk';
import { WalletParamsWithKind } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';

import {
  EvmReviewData as GenericEvmReviewData,
  TezosReviewData as GenericTezosReviewData,
  ReviewData as GenericReviewData
} from 'lib/temple/front/estimation-data-providers';
import { TempleChainKind } from 'temple/types';

export interface EvmSwapReviewData {
  needsApproval: boolean;
  neededApproval: boolean;
  onChainAllowance: bigint;
  onConfirm: EmptyFn;
  minimumReceived: {
    amount: string;
    symbol: string;
  };
  lifiStep: LiFiStep;
}

export interface TezosSwapReviewData {
  opParams: WalletParamsWithKind[];
  cashbackInTkey?: string;
  onConfirm: SyncFn<BatchWalletOperation | undefined>;
  minimumReceived: {
    amount: string;
    symbol: string;
  };
}

export type EvmReviewData = GenericEvmReviewData<EvmSwapReviewData>;

export type TezosReviewData = GenericTezosReviewData<TezosSwapReviewData>;

export type ReviewData = GenericReviewData<EvmSwapReviewData | TezosSwapReviewData>;

// export type EvmReviewData<T extends object> = T & {
//   account: AccountForChain<TempleChainKind.EVM>;
//   network: EvmChain;
// };
//
// export type TezosReviewData<T extends object> = T & {
//   account: AccountForChain<TempleChainKind.Tezos>;
//   network: TezosChain;
// };

export type SwapReviewData = TezosReviewData | EvmReviewData;

export const isSwapEvmReviewData = (data: SwapReviewData): data is EvmReviewData =>
  data.network.kind === TempleChainKind.EVM;
