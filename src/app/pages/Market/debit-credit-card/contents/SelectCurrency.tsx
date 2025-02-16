import React, { FC, useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { useFormContext } from 'react-hook-form-v7';
import { useDebounce } from 'use-debounce';

import { EmptyState } from 'app/atoms/EmptyState';
import { BackButton } from 'app/atoms/PageModal';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { isSearchStringApplicable, searchAndFilterItems } from 'lib/utils/search-items';

import { ModalHeaderConfig } from '../../types';
import { AssetIcon } from '../components/AssetIcon';
import { FormData } from '../config';
import { TopUpInputInterface } from '../topup.interface';

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  onGoBack: EmptyFn;
}

export const SelectCurrency: FC<Props> = ({ setModalHeaderConfig, onGoBack }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const { setValue } = useFormContext<FormData>();

  useLayoutEffect(
    () => void setModalHeaderConfig({ title: t('selectCurrency'), titleLeft: <BackButton onClick={onGoBack} /> }),
    [onGoBack, setModalHeaderConfig]
  );

  const searchedCurrencies = useMemo(
    () => (inSearch ? searchAndFilterCurrencies(currenciesMock, searchValueDebounced) : currenciesMock),
    [inSearch, searchValueDebounced]
  );

  const onCurrencySelect = useCallback(
    (currency: TopUpInputInterface) => {
      setValue('inputCurrency', currency);
      onGoBack();
    },
    [setValue, onGoBack]
  );

  return (
    <>
      <div className="p-4">
        <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} className="p-4" />
      </div>

      <div className="px-4 pb-1 flex-grow flex flex-col overflow-y-auto">
        {searchedCurrencies.length === 0 && <EmptyState />}

        {searchedCurrencies.map(currency => (
          <Currency key={currency.code} currency={currency} onClick={onCurrencySelect} />
        ))}
      </div>
    </>
  );
};

interface CurrencyProps {
  currency: TopUpInputInterface;
  iconSize?: number;
  onClick?: (currency: TopUpInputInterface) => void;
}

export const Currency: FC<CurrencyProps> = ({ currency, iconSize = 24, onClick }) => {
  const handleClick = useCallback(() => onClick?.(currency), [currency, onClick]);

  return (
    <div
      className="w-full flex justify-start items-center cursor-pointer p-2 rounded-8 hover:bg-secondary-low"
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-2 min-h-10">
        <div className="w-9 h-9 flex justify-center items-center rounded-full bg-grey-4">
          <AssetIcon useFlagIcon size={iconSize} src={currency.icon} code={currency.code} />
        </div>

        <div className="flex flex-col">
          <span className="text-font-medium">{currency.code}</span>

          <span className="text-font-description text-grey-1 w-40 truncate">{currency.name}</span>
        </div>
      </div>
    </div>
  );
};

const searchAndFilterCurrencies = (currencies: TopUpInputInterface[], searchValue: string) =>
  searchAndFilterItems(currencies, searchValue.trim(), [
    { name: 'name', weight: 1 },
    { name: 'code', weight: 1 }
  ]);

const currenciesMock: TopUpInputInterface[] = [
  {
    name: 'US Dollar',
    code: 'USD',
    codeToDisplay: 'USD',
    icon: 'https://static.moonpay.com/widget/currencies/usd.svg',
    minAmount: 35,
    maxAmount: 16000,
    precision: 2
  },
  {
    name: 'Australian Dollar',
    code: 'AUD',
    codeToDisplay: 'AUD',
    icon: 'https://static.moonpay.com/widget/currencies/aud.svg',
    minAmount: 35,
    maxAmount: 16000,
    precision: 2
  },
  {
    name: 'Bulgarian Lev',
    code: 'BGN',
    codeToDisplay: 'BGN',
    icon: 'https://static.moonpay.com/widget/currencies/bgn.svg',
    minAmount: 40,
    maxAmount: 20000,
    precision: 2
  },
  {
    name: 'Brazilian Real',
    code: 'BRL',
    codeToDisplay: 'BRL',
    icon: 'https://static.moonpay.com/widget/currencies/brl.svg',
    minAmount: 130,
    maxAmount: 65000,
    precision: 2
  },
  {
    name: 'Canadian Dollar',
    code: 'CAD',
    codeToDisplay: 'CAD',
    icon: 'https://static.moonpay.com/widget/currencies/cad.svg',
    minAmount: 30,
    maxAmount: 16000,
    precision: 2
  },
  {
    name: 'Swiss Franc',
    code: 'CHF',
    codeToDisplay: 'CHF',
    icon: 'https://static.moonpay.com/widget/currencies/chf.svg',
    minAmount: 20,
    maxAmount: 11000,
    precision: 2
  },
  {
    name: 'Colombian Peso',
    code: 'COP',
    codeToDisplay: 'COP',
    icon: 'https://static.moonpay.com/widget/currencies/cop.svg',
    minAmount: 100000,
    maxAmount: 42500000,
    precision: 0
  },
  {
    name: 'Czech Koruna',
    code: 'CZK',
    codeToDisplay: 'CZK',
    icon: 'https://static.moonpay.com/widget/currencies/czk.svg',
    minAmount: 500,
    maxAmount: 260000,
    precision: 2
  },
  {
    name: 'Danish Krone',
    code: 'DKK',
    codeToDisplay: 'DKK',
    icon: 'https://static.moonpay.com/widget/currencies/dkk.svg',
    minAmount: 150,
    maxAmount: 75000,
    precision: 2
  },
  {
    name: 'Dominican Peso',
    code: 'DOP',
    codeToDisplay: 'DOP',
    icon: 'https://static.moonpay.com/widget/currencies/dop.svg',
    minAmount: 1500,
    maxAmount: 680000,
    precision: 2
  }
];
