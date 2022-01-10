import React, { FC } from 'react';

import classNames from 'clsx';

interface Props {
  text: string;
}

export const SwapRouteInfo: FC<Props> = ({ text }) => (
  <p
    style={{
      height: '4.625rem'
    }}
    className={classNames(
      'flex justify-center items-center mb-2',
      'px-4',
      'text-gray-600',
      'border rounded-md border-gray-300'
    )}
  >
    {text}
  </p>
);
