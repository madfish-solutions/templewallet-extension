import React, { FC } from 'react';

import { List } from 'react-virtualized';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnvStyle } from 'app/hooks/use-app-env-style.hook';
import { T } from 'lib/i18n';

import { CurrencyBase } from '../types';
import { CurrencyOption } from './CurrencyOption';

interface Props {
  value: CurrencyBase;
  options: CurrencyBase[];
  isLoading?: boolean;
  opened: boolean;
  fitIcons?: boolean;
  setOpened: (newValue: boolean) => void;
  onChange?: (newValue: CurrencyBase) => void;
}

export const CurrenciesMenu: FC<Props> = ({
  value,
  options,
  isLoading = false,
  opened,
  fitIcons,
  setOpened,
  onChange
}) => {
  const { dropdownWidth } = useAppEnvStyle();

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
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" style={{ width: '3rem' }} />
          ) : (
            <p className="flex items-center justify-center text-gray-600 text-base font-light">
              <T id="noAssetsFound" />
            </p>
          )}
        </div>
      )}
      <List
        width={dropdownWidth}
        height={options.length > 2 ? 240 : 132}
        rowCount={options.length}
        rowHeight={65}
        rowRenderer={({ key, index, style }) => (
          <CurrencyOption
            key={key}
            currency={options[index]}
            isSelected={value.code === options[index].code && value.network === options[index].network}
            fitIcons={fitIcons}
            style={style}
            onClick={handleOptionClick}
          />
        )}
      />
    </DropdownWrapper>
  );
};
