import { LiFiStep } from '@lifi/sdk';
import { WalletParamsWithKind } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';

import {
  EvmReviewData as GenericEvmReviewData,
  TezosReviewData as GenericTezosReviewData
} from 'lib/temple/front/estimation-data-providers';
import { TempleChainKind } from 'temple/types';

interface EvmSwapReviewData {
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

interface TezosSwapReviewData {
  opParams: WalletParamsWithKind[];
  cashbackInTkey?: string;
  onConfirm: SyncFn<BatchWalletOperation | undefined>;
  minimumReceived: {
    amount: string;
    symbol: string;
  };
}

export type SwapFieldName = 'input' | 'output';

export type EvmReviewData = GenericEvmReviewData<EvmSwapReviewData>;

export type TezosReviewData = GenericTezosReviewData<TezosSwapReviewData>;

export type SwapReviewData = TezosReviewData | EvmReviewData;

export const isSwapEvmReviewData = (data: SwapReviewData): data is EvmReviewData =>
  data.network.kind === TempleChainKind.EVM;
