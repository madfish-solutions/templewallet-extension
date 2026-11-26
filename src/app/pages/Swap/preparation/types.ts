import type { LiFiStep, Route as LiFiRoute } from '@lifi/sdk';

import type { Route3EvmRoute } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import type { AlchemyBatchQuote, AlchemyWalletConfig } from 'lib/evm/alchemy/types';
import type { TezosEstimationData } from 'lib/temple/front/estimation-data-providers';
import type { EvmEstimationData } from 'temple/evm/estimate';
import type { AssetsAmounts } from 'temple/types';

import type { EvmStepAllowance } from '../evm/fetch-evm-allowances';

import type { TezosSwapOperations } from './tezos/build-swap-operations';

export interface PreparedTezosReview {
  estimationData: TezosEstimationData;
  balancesChanges: AssetsAmounts;
  preparedAt: number;
}

export type PreparedTezosSwap = TezosSwapOperations & PreparedTezosReview;

export interface PreparedEvmBatchAction {
  kind: 'batch';
  quote: AlchemyBatchQuote;
  steps: LiFiStep[];
}

export type PreparedEvmStepAction =
  | { kind: 'execute'; stepIndex: number; step: LiFiStep | Route3EvmRoute; estimation: EvmEstimationData }
  | { kind: 'approval'; stepIndex: number; reset: boolean; txData: HexString; estimation: EvmEstimationData };

export type PreparedEvmAction = PreparedEvmBatchAction | PreparedEvmStepAction;

interface PreparedEvmBatchSwap {
  path: 'batch';
  route: LiFiRoute | Route3EvmRoute;
  walletConfig: AlchemyWalletConfig;
  firstAction: PreparedEvmBatchAction;
}

interface PreparedEvmStepsSwap {
  path: 'steps';
  route: LiFiRoute | Route3EvmRoute;
  walletConfig: AlchemyWalletConfig | null;
  allowances: EvmStepAllowance[];
  firstAction: PreparedEvmStepAction;
}

export type PreparedEvmSwap = PreparedEvmBatchSwap | PreparedEvmStepsSwap;
