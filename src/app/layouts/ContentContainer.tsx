import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

type ContentContainerProps = HTMLAttributes<HTMLDivElement> & {
  padding?: boolean;
};

const ContentContainer: FC<ContentContainerProps> = ({ padding = true, className, ...rest }) => (
  <div className={classNames('w-full max-w-screen-sm mx-auto', padding && 'px-4', className)} {...rest} />
);

export default ContentContainer;
