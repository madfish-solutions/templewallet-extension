import React, { useCallback } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { PopperRenderProps } from 'lib/ui/Popper';

import { IconifiedSelectProps } from './types';

type IconifiedSelectMenuProps<T> = PopperRenderProps &
  Omit<IconifiedSelectProps<T>, 'className' | 'title' | 'OptionSelectedContent' | 'OptionSelectedIcon'> & {
    withSearch: boolean;
  };

export const IconifiedSelectMenu = <T extends unknown>(props: IconifiedSelectMenuProps<T>) => {
  const {
    opened,
    options,
    value,
    padded,
    withSearch,
    isDisabled,
    setOpened,
    onChange,
    getKey,
    Icon,
    OptionInMenuContent
  } = props;
  const handleOptionClick = useCallback(
    (newValue: T) => {
      if (getKey(newValue) !== getKey(value)) {
        onChange?.(newValue);
      }
      setOpened(false);
    },
    [onChange, setOpened, value, getKey]
  );

  return (
    <DropdownWrapper
      opened={opened}
      className={classNames('origin-top overflow-x-hidden overflow-y-auto', padded && 'p-2')}
      style={{
        maxHeight: '15.125rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0'
      }}
    >
      {options.map(option => (
        <IconifiedSelectOption
          disabled={isDisabled?.(option)}
          key={getKey(option)}
          value={option}
          selected={getKey(option) === getKey(value)}
          onClick={handleOptionClick}
          Icon={Icon}
          OptionInMenuContent={OptionInMenuContent}
          padded={padded}
          withSearch={withSearch}
        />
      ))}
    </DropdownWrapper>
  );
};

type IconifiedSelectOptionProps<T> = Pick<IconifiedSelectProps<T>, 'Icon' | 'OptionInMenuContent' | 'value'> & {
  disabled?: boolean;
  value: T;
  selected: boolean;
  padded?: boolean;
  withSearch: boolean;
  onClick?: IconifiedSelectProps<T>['onChange'];
};

const IconifiedSelectOption = <T extends unknown>(props: IconifiedSelectOptionProps<T>) => {
  const { disabled, value, selected, padded, withSearch, onClick, Icon, OptionInMenuContent } = props;

  const handleClick = useCallback(() => {
    onClick?.(value);
  }, [onClick, value]);

  return (
    <button
      type="button"
      className={classNames(
        'flex items-center w-full py-3 px-4 text-left rounded transition easy-in-out duration-200',
        padded && 'mb-1',
        selected ? 'bg-gray-200' : !disabled && 'hover:bg-gray-100',
        disabled && 'opacity-25',
        disabled ? 'cursor-default' : 'cursor-pointer'
      )}
      disabled={disabled}
      autoFocus={!withSearch && selected}
      onClick={disabled ? undefined : handleClick}
    >
      <Icon option={value} />

      <OptionInMenuContent option={value} />
    </button>
  );
};
