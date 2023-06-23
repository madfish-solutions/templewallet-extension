import React, { ReactNode, type FC } from 'react';

import classNames from 'clsx';

interface Props {
  className?: string;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const InputContainer: FC<Props> = ({ className, header, children, footer }) => {
  return (
    <div className={classNames(className, 'w-full flex flex-col gap-1')}>
      {header && <div>{header}</div>}
      <div>{children}</div>
      {footer && <div>{footer}</div>}
    </div>
  );
};
