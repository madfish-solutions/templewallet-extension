import { LiFiStep } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

import { Route3EvmRoute } from '../../form/interfaces';

type UserActionType = 'approve' | 'execute';

export interface UserAction {
  type: UserActionType;
  stepIndex: number;
  routeStep: LiFiStep | Route3EvmRoute;
}

export interface InitialInputData {
  tokenSlug: string;
  network: EvmNetworkEssentials;
}
