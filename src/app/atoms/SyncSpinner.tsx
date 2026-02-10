import { FC } from 'react';

import clsx from 'clsx';

import { Loader } from './Loader';

interface Props {
  className?: string;
}

export const SyncSpinner: FC<Props> = ({ className }) => (
  <div className={clsx('flex justify-around', className)}>
    <Loader size="L" trackVariant="dark" className="text-secondary" />
  </div>
);
