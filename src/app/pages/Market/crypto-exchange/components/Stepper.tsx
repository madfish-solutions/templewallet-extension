import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';
import { range } from 'lodash';

import { Steps } from '../context';

type Status = 'active' | 'next' | 'default';

interface Props {
  currentStep: Steps;
}

export const Stepper = memo<Props>(({ currentStep }) => {
  const stepsStatuses = useMemo(
    () =>
      range(0, 3).map(stepIndex =>
        currentStep > stepIndex ? 'active' : currentStep === stepIndex ? 'next' : 'default'
      ),
    [currentStep]
  );
  return (
    <div className="flex flex-row h-2.5 items-center gap-x-1">
      {stepsStatuses.map((status, index) => (
        <Step key={index} status={status} />
      ))}
    </div>
  );
});

interface StepProps {
  status: Status;
}

const bgColorRecord = {
  active: 'bg-success',
  next: 'bg-success-low',
  default: 'bg-grey-4'
};

const Step: FC<StepProps> = ({ status = 'default' }) => (
  <div className={clsx('w-full h-1.5 rounded', bgColorRecord[status])} />
);
