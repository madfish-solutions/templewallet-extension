import { FC } from 'react';

import clsx from 'clsx';

interface Props extends PropsWithChildren {
  className?: string;
}

export const InfoContainer: FC<Props> = ({ className, children }) => (
  <div className={clsx('flex flex-col px-4 py-2 rounded-8 bg-white border-0.5 border-lines', className)}>
    {children}
  </div>
);
