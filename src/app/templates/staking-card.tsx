import React, { FC, HTMLAttributes } from 'react';

import clsx from 'clsx';

import { Divider } from 'app/atoms';

interface StakingCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  topInfo: ReactChildren;
  bottomInfo?: ReactChildren;
  actions?: ReactChildren;
}

export const StakingCard: FC<StakingCardProps> = ({ topInfo, bottomInfo, actions, className, ...rest }) => (
  <div className={clsx('flex flex-col rounded-lg shadow-bottom bg-white p-4', className)} {...rest}>
    <div className="flex justify-between gap-2 items-center">{topInfo}</div>
    <Divider className="my-2" thinest />
    {bottomInfo && <div className="flex justify-between gap-2 items-center">{bottomInfo}</div>}
    {actions && <div className="flex justify-stretch gap-2 items-center mt-4">{actions}</div>}
  </div>
);
