import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CircleIcon } from 'app/icons/base/circle.svg';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';

import { IconBase } from './IconBase';

interface Props {
  active: boolean;
  className?: string;
}

export const RadioButton = memo<Props>(({ active, className }) => {
  if (active) return <IconBase Icon={OkFillIcon} size={24} className={clsx('text-primary', className)} />;

  return <IconBase Icon={CircleIcon} size={24} className={clsx('text-grey-3', className)} />;
});
