import React, { memo, useCallback, useMemo } from 'react';

import { CellPartProps, SelectWithModal } from 'app/templates/select-with-modal';
import { AnalyticsEventCategory, AnalyticsEventEnum, useAnalytics } from 'lib/analytics';
import {
  FIAT_CURRENCIES_BASE,
  FiatCurrencyOption,
  FiatCurrenciesEnum,
  FiatCurrencyOptionBase,
  useFiatCurrency
} from 'lib/fiat-currency';
import { t } from 'lib/i18n';

import { SettingsGeneralSelectors } from '../../selectors';

import { CurrencyIcon } from './currency-icon';

const searchKeys = [
  { name: 'name', weight: 1 },
  { name: 'fullname', weight: 0.75 }
];

const currencyOptionKeyFn = ({ name }: FiatCurrencyOption) => name;

const CellName = ({ option: { fullname } }: CellPartProps<FiatCurrencyOption>) => <span>{fullname}</span>;

const makeOptionWithFullName = (option: FiatCurrencyOptionBase) => {
  const keyPrefix = option.name.toLowerCase() as Lowercase<FiatCurrenciesEnum>;

  return {
    ...option,
    fullname: t(`${keyPrefix}Name`)
  };
};

export const FiatCurrencySelect = memo(() => {
  const { selectedFiatCurrency, setSelectedFiatCurrency } = useFiatCurrency();
  const { trackEvent } = useAnalytics();

  const options = useMemo(() => FIAT_CURRENCIES_BASE.map(makeOptionWithFullName), []);
  const value = useMemo(
    () =>
      options.find(({ name }) => name === selectedFiatCurrency.name) ?? makeOptionWithFullName(FIAT_CURRENCIES_BASE[0]),
    [options, selectedFiatCurrency.name]
  );

  const handleCurrencyChange = useCallback(
    (option: FiatCurrencyOption) => {
      trackEvent(AnalyticsEventEnum.FiatCurrencyChanged, AnalyticsEventCategory.ButtonPress, { name: option.name });
      setSelectedFiatCurrency(option);
    },
    [setSelectedFiatCurrency, trackEvent]
  );

  return (
    <SelectWithModal
      className="mb-2"
      title={t('fiatCurrency')}
      options={options}
      value={value}
      searchKeys={searchKeys}
      searchThreshold={0.25}
      keyFn={currencyOptionKeyFn}
      CellIcon={CurrencyIcon}
      CellName={CellName}
      onSelect={handleCurrencyChange}
      testID={SettingsGeneralSelectors.currencyDropDown}
      itemTestID={SettingsGeneralSelectors.currencyItem}
    />
  );
});
