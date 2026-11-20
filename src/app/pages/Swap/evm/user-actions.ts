import type { LiFiStep } from '@lifi/sdk';

import { needsApprovalReset } from 'lib/evm/approval';

import { isLifiStep, Route3EvmRoute } from '../form/interfaces';

type UserActionType = 'reset-approval' | 'approve' | 'execute';

export interface UserAction {
  type: UserActionType;
  stepIndex: number;
  routeStep: LiFiStep | Route3EvmRoute;
  batchSteps?: LiFiStep[];
}

export const buildEvmUserActions = (
  steps: Array<LiFiStep | Route3EvmRoute>,
  sufficient: boolean[],
  onChain: bigint[]
): UserAction[] =>
  steps.flatMap<UserAction>((step, stepIndex) => {
    const stepActions: UserAction[] = [];
    if (!sufficient[stepIndex]) {
      if (isLifiStep(step) && needsApprovalReset(step.estimate, onChain[stepIndex], BigInt(step.action.fromAmount))) {
        stepActions.push({ type: 'reset-approval', stepIndex, routeStep: step });
      }
      stepActions.push({ type: 'approve', stepIndex, routeStep: step });
    }
    stepActions.push({ type: 'execute', stepIndex, routeStep: step });
    return stepActions;
  });
