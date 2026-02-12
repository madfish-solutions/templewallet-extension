import { memo } from 'react';

import clsx from 'clsx';

interface Props {
  className?: string;
}

export const AnimatedDot = memo<Props>(({ className }) => (
  <div className={clsx('absolute', className)}>
    <span className="relative flex w-1 h-1">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-circle bg-primary-hover opacity-75" />
      <span className="relative inline-flex rounded-circle w-1 h-1 bg-primary" />
    </span>
  </div>
));
