import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as CheckMarkIcon } from 'app/icons/check-mark.svg';
import { ReactComponent as SelectArrowDownIcon } from 'app/icons/select-arrow-down.svg';
import { t } from 'lib/i18n/react';

interface SeedLengthSelectProps {
  options: Array<string>;
  defaultOption?: string;
  onChange: (newSelectedOption: string) => void;
}

export const SeedLengthSelect: FC<SeedLengthSelectProps> = ({ options, defaultOption, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(defaultOption ?? '');
  const [isOpen, setIsOpen] = useState(false);

  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectRef]);

  const handleClick = useCallback(
    option => {
      setIsOpen(false);
      setSelectedOption(option);
      onChange(option);
    },
    [onChange]
  );

  return (
    <div
      ref={selectRef}
      className={classNames('absolute right-0 z-10 text-gray-700 border-2 rounded-md bg-white cursor-pointer')}
    >
      <div className={classNames('flex flex-row justify-around p-2')} onClick={() => setIsOpen(!isOpen)}>
        <span style={{ fontSize: 13 }}>{t('seedInputNumberOfWords', [`${selectedOption}`])}</span>
        <SelectArrowDownIcon className="ml-1" />
      </div>
      <ul className={classNames(!isOpen && 'hidden')}>
        {options.map(option => {
          return (
            <li
              key={option}
              value={option}
              onClick={() => handleClick(option)}
              className={classNames(
                selectedOption === option ? 'bg-gray-200' : 'hover:bg-gray-100',
                'text-gray-800',
                'py-1 px-4',
                'flex flex-row justify-between'
              )}
              style={{ fontSize: 17 }}
            >
              {selectedOption === option ? <CheckMarkIcon /> : <span />}
              {option}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
