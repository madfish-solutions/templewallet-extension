import React, { FC, memo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { CrossChainPhase } from 'app/store/cross-chain-send/state';
import { T, TID } from 'lib/i18n';

interface Props {
  phase: CrossChainPhase;
}

type StepState = 'done' | 'active' | 'upcoming';

const STEP_INDEX_BY_PHASE: Record<CrossChainPhase, number> = {
  PENDING_TX: 0,
  TX_CONFIRMED: 1,
  EXCHANGING: 2,
  COMPLETED: 3,
  FAILED: 3
};

const STEP_LABEL_IDS: TID[] = ['sendStepperConfirmation', 'sendStepperExchange', 'sendStepperSending'];

export const CrossChainStepper = memo<Props>(({ phase }) => {
  const currentStep = STEP_INDEX_BY_PHASE[phase];

  return (
    <div className="flex items-center gap-x-2">
      {STEP_LABEL_IDS.map((labelId, i) => {
        const state: StepState = currentStep > i ? 'done' : currentStep === i ? 'active' : 'upcoming';
        return <Pill key={labelId} labelId={labelId} state={state} />;
      })}
    </div>
  );
});

interface PillProps {
  labelId: TID;
  state: StepState;
}

const pillBgClass = (state: StepState) => {
  switch (state) {
    case 'done':
      return 'bg-success-low';
    case 'active':
      return 'bg-warning-low';
    default:
      return 'bg-grey-4';
  }
};

const Pill: FC<PillProps> = ({ labelId, state }) => (
  <div
    className={clsx(
      'flex-1 h-8 flex items-center justify-center gap-x-1 rounded-6 border-0.5 border-lines text-font-small-bold text-text',
      pillBgClass(state)
    )}
  >
    {state === 'done' ? (
      <IconBase Icon={OkFillIcon} size={12} className="text-success" />
    ) : (
      <span className={clsx('w-1.5 h-1.5 rounded-full', state === 'active' ? 'bg-warning' : 'bg-grey-3')} />
    )}
    <span>
      <T id={labelId} />
    </span>
  </div>
);
