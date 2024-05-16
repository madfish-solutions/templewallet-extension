import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

import { setTestID, TestIDProps } from 'lib/analytics';

interface NameProps extends HTMLAttributes<HTMLDivElement>, TestIDProps {}

const Name: FC<NameProps> = ({ className, style = {}, testID, ...rest }) => (
  <div
    className={classNames('max-w-48 whitespace-nowrap overflow-x-auto truncate no-scrollbar', className)}
    style={style}
    {...setTestID(testID)}
    {...rest}
  />
);

export default Name;
