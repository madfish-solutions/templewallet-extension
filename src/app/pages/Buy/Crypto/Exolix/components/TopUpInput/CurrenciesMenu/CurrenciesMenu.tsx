import React, { FC } from 'react';

import { List } from 'react-virtualized';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { T } from 'lib/i18n/react';

import { useAppEnvStyle } from '../../../../../../../hooks/useAppEnvStyle';
import { CurrencyInterface } from '../../../exolix.interface';
import { CurrencyOption } from './CurrencyOption/CurrencyOption';

interface Props {
  value: CurrencyInterface;
  options: CurrencyInterface[];
  isLoading?: boolean;
  opened: boolean;
  setOpened: (newValue: boolean) => void;
  onChange: (newValue: CurrencyInterface) => void;
}

export const CurrenciesMenu: FC<Props> = ({ value, options, isLoading = false, opened, setOpened, onChange }) => {
  const { dropdownWidth } = useAppEnvStyle();

  const handleOptionClick = (newValue: CurrencyInterface) => {
    if (value.code !== newValue.code || value.network !== newValue.network) {
      onChange(newValue);
    }
    setOpened(false);
  };

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top overflow-x-hidden overflow-y-auto"
      style={{
        maxHeight: options.length > 2 ? '15.75rem' : '8.25rem',
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
      {/*// @ts-ignore*/}
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
            style={style}
            onClick={handleOptionClick}
          />
        )}
      />
    </DropdownWrapper>
  );
};
