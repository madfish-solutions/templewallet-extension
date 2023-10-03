import * as React from 'react';

import clsx from 'clsx';

import Spinner from './Spinner/Spinner';

interface Props {
  className?: string;
}

export const SyncSpinner: React.FC<Props> = ({ className }) => (
  <div className={clsx('w-full', className)}>
    <Spinner theme="gray" className="w-16 m-auto" />
  </div>
);
