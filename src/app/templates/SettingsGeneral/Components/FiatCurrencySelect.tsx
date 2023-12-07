import React, { useCallback, FC, useState, useMemo } from 'react';

import classNames from 'clsx';

import { DropdownSelect } from 'app/templates/DropdownSelect/DropdownSelect';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { AnalyticsEventCategory, AnalyticsEventEnum, setTestID, useAnalytics } from 'lib/analytics';
import { FIAT_CURRENCIES, FiatCurrencyOption, useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { SettingsGeneralSelectors } from '../selectors';

const renderOptionContent = (option: FiatCurrencyOption, isSelected: boolean) => (
  <FiatCurrencyOptionContent option={option} isSelected={isSelected} />
);

const FiatCurrencySelect: FC = () => {
  const { trackEvent } = useAnalytics();
  const { selectedFiatCurrency, setSelectedFiatCurrency } = useFiatCurrency();

  const value = selectedFiatCurrency;

  const [searchValue, setSearchValue] = useState<string>('');

  const options = useMemo<Array<FiatCurrencyOption>>(
    () =>
      searchAndFilterItems(
        FIAT_CURRENCIES,
        searchValue,
        [
          { name: 'name', weight: 1 },
          { name: 'fullname', weight: 0.75 }
        ],
        null,
        0.25
      ),
    [searchValue]
  );

  const handleFiatCurrencyChange = useCallback(
    (fiatOption: FiatCurrencyOption) => {
      trackEvent(AnalyticsEventEnum.FiatCurrencyChanged, AnalyticsEventCategory.ButtonPress, {
        name: fiatOption.name
      });
      setSelectedFiatCurrency(fiatOption);
    },
    [setSelectedFiatCurrency, trackEvent]
  );

  return (
    <InputContainer className="mb-8" header={<FiatCurrencyTitle />}>
      <DropdownSelect
        testID={SettingsGeneralSelectors.currenctyDropDown}
        optionsListClassName="p-2"
        dropdownButtonClassName="p-3"
        DropdownFaceContent={<FiatCurrencyFieldContent option={value} />}
        optionsProps={{
          options,
          noItemsText: 'No items',
          getKey: option => option.fullname,
          renderOptionContent: option => renderOptionContent(option, option.fullname === selectedFiatCurrency.fullname),
          onOptionChange: handleFiatCurrencyChange
        }}
        searchProps={{
          searchValue,
          onSearchChange: event => setSearchValue(event.target.value)
        }}
      />
    </InputContainer>
  );
};

export default FiatCurrencySelect;

const FiatCurrencyTitle: FC = () => (
  <h2 className="leading-tight flex flex-col">
    <span className="text-base font-semibold text-gray-700">
      <T id="fiatCurrency" />
    </span>
  </h2>
);

interface FiatCurrencyOptionContentProps {
  option: FiatCurrencyOption;
  isSelected?: boolean;
}

const FiatCurrencyIcon: FC<FiatCurrencyOptionContentProps> = ({ option: { symbol } }) => (
  <div
    className="w-6 flex justify-center items-center ml-2 mr-3 text-xl text-gray-700 font-normal"
    style={{ height: '1.3125rem' }}
  >
    {symbol}
  </div>
);

const FiatCurrencyFieldContent: FC<FiatCurrencyOptionContentProps> = ({ option }) => {
  return (
    <div className="flex items-center">
      <FiatCurrencyIcon option={option} />

      <span className="text-xl text-gray-700">{option.name}</span>
    </div>
  );
};

const FiatCurrencyOptionContent: FC<FiatCurrencyOptionContentProps> = ({ option, isSelected }) => {
  return (
    <div
      className={classNames(
        'w-full flex items-center py-1.5 px-2 rounded',
        isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
      )}
    >
      <FiatCurrencyIcon option={option} />

      <div className="w-full text-left text-lg text-gray-700" {...setTestID(SettingsGeneralSelectors.currencyItem)}>
        {option.name} ({option.fullname})
      </div>
    </div>
  );
};
