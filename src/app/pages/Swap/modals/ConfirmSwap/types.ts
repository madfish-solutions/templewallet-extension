import { LiFiStep } from '@lifi/sdk';

type UserActionType = 'approve' | 'execute';

export interface UserAction {
  type: UserActionType;
  stepIndex: number;
  routeStep: LiFiStep;
}
