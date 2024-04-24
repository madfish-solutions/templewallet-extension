import React, { FC, HTMLAttributes, useMemo } from 'react';

import classNames from 'clsx';

import { setTestID, TestIDProps } from 'lib/analytics';

interface NameProps extends HTMLAttributes<HTMLDivElement>, TestIDProps {}

const Name: FC<NameProps> = ({ className, style = {}, testID, ...rest }) => (
  <div
    className={classNames('whitespace-nowrap overflow-x-auto truncate no-scrollbar', className)}
    style={useMemo(() => ({ maxWidth: '12rem', ...style }), [style])}
    {...setTestID(testID)}
    {...rest}
  />
);

export default Name;
