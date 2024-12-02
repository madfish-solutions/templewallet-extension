import React, { FC, memo } from 'react';

import clsx from 'clsx';

type Status = 'active' | 'next' | 'default';

interface Props {
  currentStep: 0 | 1 | 2 | 3;
}

export const Stepper = memo<Props>(({ currentStep }) => {
  const first: Status = currentStep === 0 ? 'next' : 'active';
  const second: Status = currentStep > 1 ? 'active' : currentStep === 1 ? 'next' : 'default';
  const third: Status = currentStep > 2 ? 'active' : currentStep === 2 ? 'next' : 'default';

  return (
    <div className="flex flex-row h-2.5 items-center gap-x-1">
      <Step status={first} />
      <Step status={second} />
      <Step status={third} />
    </div>
  );
});

interface StepProps {
  status?: Status;
}

const bgColorRecord = {
  active: 'bg-success',
  next: 'bg-success-low',
  default: 'bg-grey-4'
};

const Step: FC<StepProps> = ({ status = 'default' }) => (
  <div className={clsx('w-full h-1.5 rounded', bgColorRecord[status])} />
);
