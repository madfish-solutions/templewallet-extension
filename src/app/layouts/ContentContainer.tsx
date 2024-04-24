import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

export const CONTENT_CONTAINER_CLASSNAME = 'max-w-full w-96 mx-auto';

interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export const ContentContainer: FC<ContentContainerProps> = ({ padding = false, className, ...rest }) => (
  <div className={classNames(CONTENT_CONTAINER_CLASSNAME, padding && 'px-4', className)} {...rest} />
);
