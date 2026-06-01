import React, { FC } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as XCircleFill } from 'app/icons/base/x_circle_fill.svg';
import { CrossChainPhase } from 'app/store/cross-chain-send/state';
import { T, TID } from 'lib/i18n';

interface Props {
  phase: CrossChainPhase;
}

type StepState = 'done' | 'active' | 'upcoming' | 'error';

const STEP_INDEX_BY_PHASE: Record<CrossChainPhase, number> = {
  PENDING_TX: 0,
  TX_CONFIRMED: 1,
  EXCHANGING: 2,
  COMPLETED: 3,
  FAILED: 3
};

const STEP_LABEL_IDS: TID[] = ['sendStepperConfirmation', 'sendStepperExchange', 'sendStepperSending'];

export const CrossChainStepper: FC<Props> = ({ phase }) => {
  const currentStep = STEP_INDEX_BY_PHASE[phase];
  const failed = phase === 'FAILED';

  return (
    <div className="flex items-center gap-x-2">
      {STEP_LABEL_IDS.map((labelId, i) => {
        const isLast = i === STEP_LABEL_IDS.length - 1;
        const state: StepState =
          failed && isLast ? 'error' : currentStep > i ? 'done' : currentStep === i ? 'active' : 'upcoming';
        return <Pill key={labelId} labelId={labelId} state={state} />;
      })}
    </div>
  );
};

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
    case 'error':
      return 'bg-error-low';
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
    ) : state === 'error' ? (
      <IconBase Icon={XCircleFill} size={12} className="text-error" />
    ) : (
      <span className={clsx('w-1.5 h-1.5 rounded-full', state === 'active' ? 'bg-warning' : 'bg-grey-3')} />
    )}
    <span>
      <T id={labelId} />
    </span>
  </div>
);
