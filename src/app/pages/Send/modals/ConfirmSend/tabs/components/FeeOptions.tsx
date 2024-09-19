import React, { FC } from 'react';

import clsx from 'clsx';

import FastIconSrc from 'app/icons/fee-options/fast.svg?url';
import MiddleIconSrc from 'app/icons/fee-options/middle.svg?url';
import SlowIconSrc from 'app/icons/fee-options/slow.svg?url';

export type OptionLabel = 'slow' | 'mid' | 'fast';

interface Option {
  label: OptionLabel;
  iconSrc: string;
  textColorClassName: string;
}

const options: Option[] = [
  { label: 'slow', iconSrc: SlowIconSrc, textColorClassName: 'text-error' },
  { label: 'mid', iconSrc: MiddleIconSrc, textColorClassName: 'text-warning' },
  { label: 'fast', iconSrc: FastIconSrc, textColorClassName: 'text-success' }
];

interface FeeOptionsProps {
  activeOptionName: OptionLabel;
  onOptionClick?: (option: OptionLabel) => void;
}

export const FeeOptions: FC<FeeOptionsProps> = ({ activeOptionName, onOptionClick }) => {
  //const getOptionFee = useCallback(() => {}, []);

  return (
    <div className="flex flex-row gap-x-2">
      {options.map(option => (
        <Option
          key={option.label}
          option={option}
          active={activeOptionName === option.label}
          onClick={() => onOptionClick?.(option.label)}
        />
      ))}
    </div>
  );
};

interface OptionProps {
  active: boolean;
  option: Option;
  onClick?: EmptyFn;
}

const Option: FC<OptionProps> = ({ active, option, onClick }) => {
  return (
    <div
      className={clsx(
        'flex flex-col flex-1 justify-center cursor-pointer',
        'items-center shadow-bottom p-2 gap-y-1 rounded-lg border-1.5',
        active ? 'border-primary' : 'border-transparent'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col text-center">
        <img src={option.iconSrc} alt={option.label} className="my-1.5" />
        <span className={clsx('text-font-description-bold', option.textColorClassName)}>
          {option.label.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col text-center">
        <span className="text-font-num-bold-12">$0.001</span>
        <span className="text-font-description text-grey-2">0.000024 ETH</span>
      </div>
    </div>
  );
};
