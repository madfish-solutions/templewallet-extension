import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import './seedLength.module.css';

import classNames from 'clsx';

import { ReactComponent as SelectArrowDownIcon } from 'app/icons/select-arrow-down.svg';
import { t } from 'lib/i18n';

interface SeedLengthSelectProps {
  options: Array<string>;
  currentOption: string;
  defaultOption?: string;
  onChange: (newSelectedOption: string) => void;
}

export const SeedLengthSelect: FC<SeedLengthSelectProps> = ({ options, currentOption, defaultOption, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(defaultOption ?? '');
  const [isOpen, setIsOpen] = useState(false);

  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedOption !== currentOption) {
      setSelectedOption(currentOption);
    }
  }, [currentOption, selectedOption]);

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
    (option: string) => {
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
                'py-1',
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
                  onChange={e => setSelectedOption(e.target.value)}
                  className="input"
                />
                <span className="text-sm">{option}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
