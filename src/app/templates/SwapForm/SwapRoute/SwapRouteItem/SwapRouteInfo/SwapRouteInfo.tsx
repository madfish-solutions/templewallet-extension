import React, { FC } from 'react';

import classNames from 'clsx';

interface Props {
  text: string;
  className?: string;
}

export const SwapRouteInfo: FC<Props> = ({ text, className }) => (
  <p
    style={{
      height: '4.625rem'
    }}
    className={classNames(
      'flex justify-center items-center mb-2',
      'px-4',
      'text-gray-600 text-center whitespace-pre-wrap',
      'border rounded-md border-gray-300',
      className
    )}
  >
    {text}
  </p>
);
