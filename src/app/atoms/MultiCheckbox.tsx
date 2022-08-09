import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

import Checkbox from 'app/atoms/Checkbox';

interface MultiCheckboxProps {
  checkboxesData: {
    checked: boolean;
    onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
    name?: string;
    label?: ReactNode;
  }[];
}

export const MultiCheckbox: FC<MultiCheckboxProps> = ({ checkboxesData }) => (
  <div
    className={classNames(
      'flex flex-col',
      'mb-2',
      'px-4',
      'bg-gray-100',
      'border-2 border-gray-300',
      'rounded-md overflow-hidden'
    )}
  >
    {checkboxesData.map((checkboxInfo, index) => (
      <label
        key={index}
        className={classNames('flex row items-center', 'cursor-pointer', 'flex items-center, py-4')}
        style={index > 0 ? { borderTopWidth: 1 } : {}}
      >
        <Checkbox name={checkboxInfo.name} checked={checkboxInfo.checked} onChange={checkboxInfo.onChange} />

        {checkboxInfo.label ? (
          <div className={classNames('ml-4', 'leading-tight', 'flex flex-col')}>
            <span className={classNames('text-sm font-semibold text-gray-700')}>{checkboxInfo.label}</span>
          </div>
        ) : null}
      </label>
    ))}
  </div>
);
