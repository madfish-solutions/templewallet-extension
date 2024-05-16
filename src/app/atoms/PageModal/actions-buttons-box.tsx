import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const ActionsButtonsBox = memo<HTMLAttributes<HTMLDivElement>>(({ className, ...restProps }) => (
  <div className={clsx('p-4 pb-6 flex flex-col bg-white', className)} {...restProps} />
));
