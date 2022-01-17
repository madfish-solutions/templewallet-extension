import React, { FC } from 'react';

import classNames from 'clsx';

interface Props {
  active: boolean;
  onClick: (value: number) => void;
  value: number;
}

export const SlippageTolerancePresetButton: FC<Props> = ({ value, active, onClick }) => (
  <button
    type="button"
    className={classNames(
      'rounded-md mr-1 px-1 h-5 border leading-tight flex items-center',
      active ? 'border-blue-600 text-gray-700' : 'border-gray-300'
    )}
    onClick={() => onClick(value)}
  >
    {value}%
  </button>
);
