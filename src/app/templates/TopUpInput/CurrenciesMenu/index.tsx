import React, { FC, useEffect } from 'react';

import { List } from 'react-virtualized';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnvStyle } from 'app/hooks/use-app-env-style.hook';
import { AnalyticsEventCategory, TestIDProperty, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';

import { CurrencyBase } from '../types';
import { CurrencyOption } from './CurrencyOption';

interface Props extends TestIDProperty {
  value: CurrencyBase;
  options: CurrencyBase[];
  isLoading?: boolean;
  opened: boolean;
  fitIcons?: boolean | ((currency: CurrencyBase) => boolean);
  emptyListPlaceholder?: string;
  setOpened: (newValue: boolean) => void;
  onChange?: (newValue: CurrencyBase) => void;
}

const ROW_HEIGHT = 65;

export const CurrenciesMenu: FC<Props> = ({
  value,
  options,
  isLoading = false,
  opened,
  fitIcons,
  emptyListPlaceholder = t('tokenNotFound'),
  testID,
  setOpened,
  onChange
}) => {
  const { dropdownWidth } = useAppEnvStyle();

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (testID && opened) trackEvent(testID, AnalyticsEventCategory.DropdownOpened);
  }, [opened, trackEvent]);

  const handleOptionClick = onChange
    ? (newValue: CurrencyBase) => {
        if (value.code !== newValue.code || value.network !== newValue.network) {
          onChange(newValue);
        }
        setOpened(false);
      }
    : undefined;

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top overflow-x-hidden overflow-y-auto p-2"
      style={{
        maxHeight: '15.75rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0',
        padding: 0
      }}
    >
      {(options.length === 0 || isLoading) && (
        <div className="my-8 mx-3 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" style={{ width: '3rem' }} />
          ) : (
            <p className="text-gray-600 text-ulg font-medium leading-tight w-full">{emptyListPlaceholder}</p>
          )}
        </div>
      )}
      <List
        width={dropdownWidth}
        height={options.length > 2 ? 240 : options.length * ROW_HEIGHT}
        rowCount={options.length}
        rowHeight={ROW_HEIGHT}
        rowRenderer={({ key, index, style }) => (
          <CurrencyOption
            key={key}
            currency={options[index]}
            isSelected={value.code === options[index].code && value.network?.code === options[index].network?.code}
            fitIcons={fitIcons}
            style={style}
            onClick={handleOptionClick}
          />
        )}
      />
    </DropdownWrapper>
  );
};
