import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as SelectArrowDownIcon } from 'app/icons/select-arrow-down.svg';
import { setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';

import { ImportAccountSelectors } from 'app/pages/ImportAccount/selectors';
import { SeedLengthOption } from './SeedLengthOption/SeedLengthOption';

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
        <span style={{ fontSize: 13 }} {...setTestID(ImportAccountSelectors.mnemonicDropDownButton)}>
          {t('seedInputNumberOfWords', [`${selectedOption}`])}{' '}
        </span>
        <SelectArrowDownIcon
          className={classNames('ml-1 transition ease-in-out duration-75', isOpen && 'transform rotate-180')}
        />
      </div>
      <ul className={classNames(!isOpen && 'hidden')}>
        {options.map(option => {
          return (
            <SeedLengthOption
              key={option}
              option={option}
              selectedOption={selectedOption}
              onClick={handleClick}
              onChange={setSelectedOption}
            />
          );
        })}
      </ul>
    </div>
  );
};
