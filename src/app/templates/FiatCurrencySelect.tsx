import React, { useMemo, useCallback, FC } from 'react';

import { AnalyticsEventCategory, AnalyticsEventEnum, useAnalytics } from 'lib/analytics';
import { FIAT_CURRENCIES, FiatCurrencyOption, getFiatCurrencyKey, useFiatCurrency } from 'lib/fiat-currency';
import { T, t } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from './IconifiedSelect';

type FiatCurrencySelectProps = {
  className?: string;
};

const FiatCurrencySelect: FC<FiatCurrencySelectProps> = ({ className }) => {
  const { trackEvent } = useAnalytics();
  const { selectedFiatCurrency, setSelectedFiatCurrency } = useFiatCurrency();

  const value = selectedFiatCurrency;

  const title = useMemo(
    () => (
      <h2 className="mb-4 leading-tight flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          <T id="fiatCurrency" />
        </span>
      </h2>
    ),
    []
  );

  const handleFiatCurrencyChange = useCallback(
    (fiatOption: FiatCurrencyOption) => {
      trackEvent(AnalyticsEventEnum.FiatCurrencyChanged, AnalyticsEventCategory.ButtonPress, { name: fiatOption.name });
      setSelectedFiatCurrency(fiatOption);
    },
    [setSelectedFiatCurrency, trackEvent]
  );

  return (
    <IconifiedSelect
      FieldContent={FiatCurrencyFieldContent}
      OptionContent={FiatCurrencyOptionContent}
      getKey={getFiatCurrencyKey}
      onChange={handleFiatCurrencyChange}
      options={FIAT_CURRENCIES}
      value={value}
      noItemsText={t('noItemsFound')}
      title={title}
      className={className}
      padded
      fieldStyle={{ minHeight: '3.375rem' }}
      search={{ filterItems: searchFiatCurrencyOptions }}
    />
  );
};

export default FiatCurrencySelect;

type SelectItemProps = IconifiedSelectOptionRenderProps<FiatCurrencyOption>;

const FiatCurrencyIcon: FC<SelectItemProps> = ({ option: { symbol } }) => (
  <div
    className="w-6 flex justify-center items-center ml-2 mr-3 text-xl text-gray-700 font-normal"
    style={{ height: '1.3125rem' }}
  >
    {symbol}
  </div>
);

const FiatCurrencyFieldContent: FC<SelectItemProps> = ({ option }) => {
  return (
    <>
      <FiatCurrencyIcon option={option} />

      <div className="flex flex-col items-start py-2 leading-none">
        <span className="text-xl text-gray-700">{option.name}</span>
      </div>
    </>
  );
};

const FiatCurrencyOptionContent: FC<SelectItemProps> = ({ option }) => {
  return (
    <>
      <FiatCurrencyIcon option={option} />

      <div className="relative w-full text-lg text-gray-700">
        {option.name} ({option.fullname})
      </div>
    </>
  );
};

const searchFiatCurrencyOptions = (searchString: string) =>
  searchAndFilterItems(
    FIAT_CURRENCIES,
    searchString,
    [
      { name: 'name', weight: 1 },
      { name: 'fullname', weight: 0.75 }
    ],
    null,
    0.25
  );
