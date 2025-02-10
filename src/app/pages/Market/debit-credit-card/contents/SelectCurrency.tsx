import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { useFormContext } from 'react-hook-form-v7';
import { useDebounce } from 'use-debounce';

import { EmptyState } from 'app/atoms/EmptyState';
import { BackButton } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
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

  const [attractSelectedCurrency, setAttractSelectedCurrency] = useState(true);

  const { watch, setValue } = useFormContext<FormData>();

  const activeCurrency = watch('inputCurrency');

  useLayoutEffect(
    () => void setModalHeaderConfig({ title: t('selectCurrency'), titleLeft: <BackButton onClick={onGoBack} /> }),
    []
  );

  const searchedCurrencies = useMemo(
    () => (inSearch ? searchAndFilterCurrencies(currenciesMock, searchValueDebounced) : currenciesMock),
    [inSearch, searchValueDebounced]
  );

  useEffect(() => {
    if (searchValueDebounced) setAttractSelectedCurrency(false);
  }, [searchValueDebounced]);

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
        <SearchBarField value={searchValue} onValueChange={setSearchValue} className="p-4" />
      </div>

      <div className="px-4 pb-1 flex-grow flex flex-col overflow-y-auto">
        {searchedCurrencies.length === 0 && <EmptyState />}

        {searchedCurrencies.map(currency => (
          <Currency
            key={currency.code}
            currency={currency}
            activeCurrency={activeCurrency}
            attractSelf={attractSelectedCurrency}
            showBalance
            onClick={onCurrencySelect}
          />
        ))}
      </div>
    </>
  );
};

interface CurrencyProps {
  currency: TopUpInputInterface;
  activeCurrency: TopUpInputInterface;
  attractSelf?: boolean;
  showBalance?: boolean;
  iconSize?: number;
  onClick?: (currency: TopUpInputInterface) => void;
}

export const Currency: FC<CurrencyProps> = ({ currency, activeCurrency, attractSelf, iconSize = 24, onClick }) => {
  const active = currency.code === activeCurrency.code;

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  const handleClick = useCallback(() => onClick?.(currency), [currency, onClick]);

  return (
    <div
      ref={elemRef}
      className="cursor-pointer mb-3 flex justify-between items-center py-2 px-3 rounded-lg shadow-bottom border-0.5 border-transparent group"
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-2">
        <AssetIcon useFlagIcon size={iconSize} src={currency.icon} code={currency.code} />

        <div className="flex flex-col">
          <span className="text-font-medium-bold">{currency.code}</span>

          <span className="text-grey-1 text-font-small">{currency.name}</span>
        </div>
      </div>

      <RadioButton active={active} className={active ? undefined : 'opacity-0 group-hover:opacity-100'} />
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
