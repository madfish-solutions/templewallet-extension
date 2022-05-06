import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

type NameProps = HTMLAttributes<HTMLDivElement>;

const Name: FC<NameProps> = ({ className, style = {}, ...rest }) => (
  <div
    className={classNames('whitespace-nowrap overflow-x-auto truncate no-scrollbar', className)}
    style={{ maxWidth: '12rem', ...style }}
    {...rest}
  />
);

export default Name;
