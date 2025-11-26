import { StepToolDetails, Route as LiFiRoute, LiFiStep } from '@lifi/sdk';
import { WalletParamsWithKind } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';

import { Route3EvmRoute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import {
  EvmReviewData as GenericEvmReviewData,
  TezosReviewData as GenericTezosReviewData
} from 'lib/temple/front/estimation-data-providers';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { AccountForChain } from 'temple/accounts';
import { EvmChain } from 'temple/front';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export type { Route3EvmRoute } from 'lib/apis/temple/endpoints/evm/api.interfaces';

export type BridgeDetails = {
  tools: StepToolDetails[];
  executionTime: string;
  priceImpact: number;
  protocolFee?: string;
  gasTokenSymbol: string;
};

export interface EvmStepReviewData {
  account: AccountForChain<TempleChainKind.EVM>;
  inputNetwork: EvmChain;
  outputNetwork: EvmChain;
  protocolFee?: string;
  destinationChainGasTokenAmount?: BigNumber;
  minimumReceived: {
    amount: string;
    symbol: string;
  };
  routeStep: LiFiStep | Route3EvmRoute;
}

interface EvmSwapReviewData {
  handleResetForm: EmptyFn;
  swapRoute: LiFiRoute | Route3EvmRoute;
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

export interface ChainAssetInfo<T extends TempleChainKind = TempleChainKind> {
  networkKind: string;
  chainId: NetworkEssentials<T>['chainId'];
  assetSlug: string;
}

export type SwapFieldName = 'input' | 'output';

export type EvmReviewData = GenericEvmReviewData<EvmSwapReviewData>;

export type TezosReviewData = GenericTezosReviewData<TezosSwapReviewData>;

export type SwapReviewData = TezosReviewData | EvmReviewData;

export const isSwapEvmReviewData = (data: SwapReviewData): data is EvmReviewData =>
  data.network.kind === TempleChainKind.EVM;

export const getCommonStepProps = (step: LiFiStep | Route3EvmRoute) => {
  if (isLifiStep(step)) {
    const { action, estimate, transactionRequest } = step;
    const { approvalAddress, toAmountMin } = estimate;
    const { fromChainId, fromToken, fromAmount, fromAddress, toChainId, toToken } = action;

    return {
      fromChainId,
      fromToken,
      fromAmount,
      fromAddress,
      approvalAddress,
      toChainId,
      toToken,
      toAmountMin,
      txDestination: transactionRequest?.to as HexString | undefined
    };
  }

  const { fromToken, fromAmount, fromAddress, txDestination, toToken, toAmountMin } = step;

  return {
    fromChainId: ETHERLINK_MAINNET_CHAIN_ID,
    fromToken,
    fromAmount,
    fromAddress,
    approvalAddress: txDestination,
    toChainId: ETHERLINK_MAINNET_CHAIN_ID,
    toToken,
    toAmountMin,
    txDestination
  };
};

export function isRoute3EvmRoute(route: Route3EvmRoute | LiFiRoute): route is Route3EvmRoute {
  return 'txData' in route;
}

export function isLifiRoute(route: Route3EvmRoute | LiFiRoute): route is LiFiRoute {
  return 'steps' in route;
}

export function isLifiStep(step: LiFiStep | Route3EvmRoute): step is LiFiStep {
  return 'type' in step;
}

export function isRoute3EvmStep(step: LiFiStep | Route3EvmRoute): step is Route3EvmRoute {
  return 'txData' in step;
}
