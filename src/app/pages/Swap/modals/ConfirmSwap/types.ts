import { LiFiStep } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

type UserActionType = 'approve' | 'execute';

export interface UserAction {
  type: UserActionType;
  stepIndex: number;
  routeStep: LiFiStep;
}

export interface InitialInputData {
  tokenSlug: string;
  network: EvmNetworkEssentials;
}
