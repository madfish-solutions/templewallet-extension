import { LiFiStep } from '@lifi/sdk';

import type { AlchemyFeeToken } from 'lib/evm/alchemy/types';
import { EvmNetworkEssentials } from 'temple/networks';

import { Route3EvmRoute } from '../../form/interfaces';

type UserActionType = 'approve' | 'execute';

export interface UserAction {
  type: UserActionType;
  stepIndex: number;
  routeStep: LiFiStep | Route3EvmRoute;
  batchSteps?: LiFiStep[];
  feeTokens?: AlchemyFeeToken[];
}

export interface InitialInputData {
  tokenSlug: string;
  network: EvmNetworkEssentials;
}
