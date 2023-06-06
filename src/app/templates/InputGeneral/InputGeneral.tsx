import React, { ReactNode, type FC } from 'react';

import classNames from 'clsx';

interface Props {
  className?: string;
  header?: ReactNode;
  mainContent: ReactNode;
  footer?: ReactNode;
}

export const InputGeneral: FC<Props> = ({ className, header, mainContent, footer }) => {
  return (
    <div className={classNames(className, 'w-full flex flex-col gap-1')}>
      <div>{header}</div>
      <div>{mainContent}</div>
      <div>{footer}</div>
    </div>
  );
};
