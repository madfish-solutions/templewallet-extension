import React, { useCallback, useEffect } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { AnalyticsEventCategory, TestIDProperty, useAnalytics } from 'lib/analytics';
import { PopperRenderProps } from 'lib/ui/Popper';

import { IconifiedSelectProps, IconifiedSelectPropsBase } from './types';

interface Props<T> extends PopperRenderProps, TestIDProperty, IconifiedSelectPropsBase<T> {
  search?: {
    value?: string;
  };
}

export const IconifiedSelectMenu = <T extends unknown>(props: Props<T>) => {
  const {
    opened,
    options,
    value,
    padded,
    noItemsText,
    search,
    testID,
    isDisabled,
    setOpened,
    onChange,
    getKey,
    OptionContent
  } = props;

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (testID && opened) trackEvent(testID, AnalyticsEventCategory.DropdownOpened);
  }, [opened]);

  const withSearch = Boolean(search);

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
      {options.length ? (
        options.map(option => (
          <IconifiedSelectOption
            disabled={isDisabled?.(option)}
            key={getKey(option)}
            value={option}
            selected={getKey(option) === getKey(value)}
            onClick={handleOptionClick}
            OptionContent={OptionContent}
            padded={padded}
            withSearch={withSearch}
          />
        ))
      ) : (
        <p
          className={classNames(
            'flex items-center justify-center text-gray-600 text-base font-light',
            !padded && 'p-2'
          )}
        >
          {search?.value ? <SearchIcon className="w-5 h-auto mr-1 stroke-current" /> : null}

          <span>{noItemsText}</span>
        </p>
      )}
    </DropdownWrapper>
  );
};

type IconifiedSelectOptionProps<T> = Pick<IconifiedSelectProps<T>, 'OptionContent' | 'value'> & {
  disabled?: boolean;
  value: T;
  selected: boolean;
  padded?: boolean;
  withSearch: boolean;
  onClick?: IconifiedSelectProps<T>['onChange'];
};

const IconifiedSelectOption = <T extends unknown>(props: IconifiedSelectOptionProps<T>) => {
  const { disabled, value, selected, padded, withSearch, onClick, OptionContent } = props;

  const handleClick = useCallback(() => {
    onClick?.(value);
  }, [onClick, value]);

  return (
    <button
      type="button"
      className={classNames(
        'flex items-center w-full py-1.5 px-2 text-left rounded transition easy-in-out duration-200',
        padded && 'mb-1',
        selected ? 'bg-gray-200' : !disabled && 'hover:bg-gray-100',
        disabled ? 'opacity-25 cursor-default' : 'cursor-pointer'
      )}
      disabled={disabled}
      autoFocus={!withSearch && selected}
      onClick={disabled ? undefined : handleClick}
    >
      <OptionContent option={value} />
    </button>
  );
};
