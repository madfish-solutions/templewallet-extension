import type { FC, RefObject } from 'react';

import type { LiFiStep } from '@lifi/sdk';

import type { EvmStepReviewData } from '../../form/interfaces';

import { BatchEvmContent } from './BatchEvmContent';
import { LegacyEvmContent } from './LegacyEvmContent';
import type { InitialInputData } from './types';

export interface EvmContentProps {
  stepReviewData: EvmStepReviewData;
  initialInputData: InitialInputData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
  cancelledRef?: RefObject<boolean | null>;
  skipStatusWait?: boolean;
  submitDisabled?: boolean;
  batchSteps?: LiFiStep[];
  onUseLegacyFlow?: EmptyFn;
  onBatchBusyChange?: SyncFn<boolean>;
}

export const EvmContent: FC<EvmContentProps> = props =>
  props.batchSteps ? <BatchEvmContent {...props} batchSteps={props.batchSteps} /> : <LegacyEvmContent {...props} />;
