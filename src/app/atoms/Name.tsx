import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

import { setTestID, TestIDProps } from 'lib/analytics';

type NameProps = HTMLAttributes<HTMLDivElement> & TestIDProps;

const Name: FC<NameProps> = ({ className, style = {}, testID, ...rest }) => (
  <div
    className={classNames('whitespace-nowrap overflow-x-auto truncate no-scrollbar', className)}
    style={{ maxWidth: '12rem', ...style }}
    {...setTestID(testID)}
    {...rest}
  />
);

export default Name;
