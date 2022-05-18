import React, { useMemo, useCallback, FC } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, AnalyticsEventEnum, useAnalytics } from 'lib/analytics';
import { FiatCurrencyOption, FIAT_CURRENCIES, getFiatCurrencyKey, useFiatCurrency } from 'lib/fiat-curency';
import { T } from 'lib/i18n/react';

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
      Icon={() => null}
      OptionSelectedIcon={() => null}
      OptionInMenuContent={FiatCurrencyInMenuContent}
      OptionSelectedContent={FiatCurrencyContent}
      getKey={getFiatCurrencyKey}
      options={FIAT_CURRENCIES}
      value={value}
      onChange={handleFiatCurrencyChange}
      title={title}
      className={className}
    />
  );
};

export default FiatCurrencySelect;

const FiatCurrencyInMenuContent: FC<IconifiedSelectOptionRenderProps<FiatCurrencyOption>> = ({
  option: { name, fullname, symbol }
}) => {
  return (
    <div className={classNames('relative w-full text-lg text-gray-700')}>
      {fullname}, {name}, {symbol}
    </div>
  );
};

const FiatCurrencyContent: FC<IconifiedSelectOptionRenderProps<FiatCurrencyOption>> = ({ option: { name } }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <span className="text-xl text-gray-700">{name}</span>
    </div>
  );
};
