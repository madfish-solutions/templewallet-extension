import React, { FC, memo, useCallback } from 'react';

import { emptyFn } from '@rnw-community/shared';
import classNames from 'clsx';

import styles from './seedLengthOption.module.css';

interface Props {
  option: string;
  selectedOption: string;
  onClick?: (option: string) => void;
  onChange?: (option: string) => void;
}

export const SeedLengthOption: FC<Props> = memo(({ option, selectedOption, onClick = emptyFn, onChange = emptyFn }) => {
  const handleClick = useCallback(() => onClick(option), [onClick, option]);
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value), [onChange]);

  return (
    <li
      value={option}
      onClick={handleClick}
      className={classNames(
        selectedOption === option ? 'bg-gray-200' : 'hover:bg-gray-100',
        'py-2',
        'text-gray-800',
        'flex justify-start px-3 m-2 rounded-md',
        'text-lg'
      )}
    >
      <label htmlFor={option} className="flex gap-2 items-center">
        <input
          type="radio"
          id={option}
          value={option}
          checked={selectedOption === option}
          onChange={handleChange}
          className={styles.input}
        />
        <span className="text-sm">{option}</span>
      </label>
    </li>
  );
});
