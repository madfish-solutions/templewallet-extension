import React, { useMemo, useCallback, FC } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, AnalyticsEventEnum, setTestID, useAnalytics } from 'lib/analytics';
import { FIAT_CURRENCIES, FiatCurrencyOption, getFiatCurrencyKey, useFiatCurrency } from 'lib/fiat-currency';
import { T } from 'lib/i18n';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from '../../IconifiedSelect';
import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';

type FiatCurrencySelectProps = {
  className?: string;
};

const FiatCurrencySelect: FC<FiatCurrencySelectProps> = ({ className }) => {
  const { trackEvent } = useAnalytics();
  const { selectedFiatCurrency, setSelectedFiatCurrency } = useFiatCurrency();

  const value = selectedFiatCurrency;

  const title = useMemo(
    () => (
      <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
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
      Icon={FiatCurrencyIcon}
      OptionSelectedIcon={FiatCurrencyIcon}
      OptionInMenuContent={FiatCurrencyInMenuContent}
      OptionSelectedContent={FiatCurrencyContent}
      getKey={getFiatCurrencyKey}
      options={FIAT_CURRENCIES}
      value={value}
      onChange={handleFiatCurrencyChange}
      title={title}
      className={className}
      testID={SettingsGeneralSelectors.currenctyDropDown}
    />
  );
};

export default FiatCurrencySelect;

const FiatCurrencyInMenuContent: FC<IconifiedSelectOptionRenderProps<FiatCurrencyOption>> = ({
  option: { name, fullname }
}) => {
  return (
    <div
      className={classNames('relative w-full text-lg text-gray-700')}
      {...setTestID(SettingsGeneralSelectors.currencyItem)}
    >
      {name} ({fullname})
    </div>
  );
};

const FiatCurrencyIcon: FC<IconifiedSelectOptionRenderProps<FiatCurrencyOption>> = ({ option: { symbol } }) => (
  <div
    className={classNames('w-6 flex justify-center items-center ml-2 mr-3 text-xl text-gray-700')}
    style={{ height: '1.3125rem' }}
  >
    {symbol}
  </div>
);

const FiatCurrencyContent: FC<IconifiedSelectOptionRenderProps<FiatCurrencyOption>> = ({ option: { name } }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <span className="text-xl text-gray-700">{name}</span>
    </div>
  );
};
