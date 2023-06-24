import * as React from 'react';

import clsx from 'clsx';

import Spinner from './Spinner/Spinner';

interface ActivitySpinnerProps {
  height?: string;
  className?: string;
}

export const ActivitySpinner: React.FC<ActivitySpinnerProps> = ({ height = '21px', className }) => (
  <div className={clsx('w-full flex items-center justify-center overflow-hidden', className)} style={{ height }}>
    <Spinner theme="gray" className="w-16" />
  </div>
);
