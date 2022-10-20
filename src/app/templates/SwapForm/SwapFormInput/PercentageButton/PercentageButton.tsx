import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n';

interface Props {
  disabled: boolean;
  percentage: number;
  onClick: (percentage: number) => void;
}

export const PercentageButton: FC<Props> = ({ percentage, onClick, disabled }) => {
  const handleClick = () => onClick(percentage);

  return (
    <button
      disabled={disabled}
      type="button"
      className={classNames(
        'border border-gray-300 text-gray-500 rounded-md ml-1',
        'h-5 w-8 flex justify-center items-center leading-tight'
      )}
      onClick={handleClick}
    >
      {percentage === 100 ? <T id="max" /> : `${percentage}%`}
    </button>
  );
};
