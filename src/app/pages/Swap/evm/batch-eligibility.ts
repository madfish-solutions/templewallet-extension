import type { LiFiStep } from '@lifi/sdk';
import { isDefined } from '@rnw-community/shared';

import { canBatchLifiSteps } from 'lib/evm/alchemy/swap';
import type { AlchemyWalletConfig } from 'lib/evm/alchemy/types';
import { TempleAccountType } from 'lib/temple/types';

import { isLifiStep, Route3EvmRoute } from '../form/interfaces';

const isBatchableRoute = (steps: Array<LiFiStep | Route3EvmRoute>): steps is LiFiStep[] =>
  steps.every(isLifiStep) && canBatchLifiSteps(steps);

export const needsAlchemyWalletConfig = (accountType: TempleAccountType, steps: Array<LiFiStep | Route3EvmRoute>) =>
  (accountType === TempleAccountType.HD || accountType === TempleAccountType.Imported) && isBatchableRoute(steps);

export const isAlchemyBatchEligible = (
  steps: Array<LiFiStep | Route3EvmRoute>,
  config: AlchemyWalletConfig | 'unavailable' | null | undefined
): steps is LiFiStep[] =>
  isDefined(config) &&
  isBatchableRoute(steps) &&
  (config === 'unavailable' || config.chains.includes(steps[0].action.fromChainId));
