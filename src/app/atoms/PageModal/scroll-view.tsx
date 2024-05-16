import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

export const ScrollView = memo<HTMLAttributes<HTMLDivElement>>(({ className, ...restProps }) => (
  <div className={clsx('px-4 flex-1 flex flex-col overflow-y-auto', className)} {...restProps} />
));
