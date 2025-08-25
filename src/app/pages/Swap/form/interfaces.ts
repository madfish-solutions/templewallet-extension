import { LiFiStep, StepToolDetails, Route } from '@lifi/sdk';
import { WalletParamsWithKind } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';

import { RouteParams } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import {
  EvmReviewData as GenericEvmReviewData,
  TezosReviewData as GenericTezosReviewData
} from 'lib/temple/front/estimation-data-providers';
import { EvmChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export type BridgeDetails = {
  tool?: StepToolDetails;
  executionTime: string;
  priceImpact: number;
  protocolFee?: string;
  gasTokenSymbol: string;
};

interface EvmSwapReviewData {
  needsApproval: boolean;
  neededApproval: boolean;
  onChainAllowance: bigint;
  onConfirm: EmptyFn;
  minimumReceived: {
    amount: string;
    symbol: string;
  };
  buildSwapRouteParams: () => RouteParams | null;
  fetchEvmSwapRoute: (params: RouteParams) => Promise<Route | undefined>;
  initialLifiStep: LiFiStep;
  bridgeInfo?: {
    protocolFee?: string;
    destinationChainGasTokenAmount?: BigNumber;
    inputNetwork?: EvmChain;
    outputNetwork?: EvmChain;
  };
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

export interface ChainAssetInfo {
  networkKind: string;
  chainId: number | string;
  assetSlug: string;
}

export type SwapFieldName = 'input' | 'output';

export type EvmReviewData = GenericEvmReviewData<EvmSwapReviewData>;

export type TezosReviewData = GenericTezosReviewData<TezosSwapReviewData>;

export type SwapReviewData = TezosReviewData | EvmReviewData;

export const isSwapEvmReviewData = (data: SwapReviewData): data is EvmReviewData =>
  data.network.kind === TempleChainKind.EVM;
