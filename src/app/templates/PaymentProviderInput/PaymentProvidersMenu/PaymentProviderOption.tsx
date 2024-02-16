import React, { FC, useMemo, CSSProperties } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';

import { useCryptoCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderIcon } from 'app/templates/TopUpProviderIcon';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t, toLocalFixed } from 'lib/i18n';
import { formatAmountToTargetSize } from 'lib/utils/amounts';

import { MoneyRange } from '../MoneyRange';

import { PaymentProviderTag, PaymentProviderTagProps } from './PaymentProviderTag';

interface Props {
  value: PaymentProviderInterface;
  isSelected: boolean;
  shouldShowSeparator: boolean;
  style?: CSSProperties;
}

export const PaymentProviderOption: FC<Props> = ({ value, isSelected, shouldShowSeparator, style }) => {
  const cryptoCurrencies = useCryptoCurrenciesSelector(value.id);

  const tagsProps = useMemo(() => {
    const result: PaymentProviderTagProps[] = [];

    if (cryptoCurrencies.some(({ code }) => code.toLowerCase() === 'usdt')) {
      result.push({ text: t('supportsUsdt'), bgColor: '#46BC94' });
    }

    if (!value.kycRequired) {
      result.push({ text: t('noKycRequired'), bgColor: '#1B262C' });
    }

    if (value.isBestPrice) {
      result.push({ text: t('bestPrice'), bgColor: '#007AFF' });
    }

    return result;
  }, [value, cryptoCurrencies]);

  const outputAmountStr = useMemo(() => {
    if (!isDefined(value.outputAmount) || !isDefined(value.outputSymbol)) return '-';

    return `≈ ${toLocalFixed(formatAmountToTargetSize(value.outputAmount))} ${value.outputSymbol}`;
  }, [value.outputAmount, value.outputSymbol]);

  const inputAmountStr = useMemo(() => {
    if (!isDefined(value.inputAmount)) return '-';

    return `${toLocalFixed(value.inputAmount, value.inputDecimals ?? 2)} ${value.inputSymbol}`;
  }, [value.inputAmount, value.inputDecimals, value.inputSymbol]);

  return (
    <div
      style={style}
      className={classNames(
        'px-4 py-3 w-full flex flex-col gap-2 border-gray-300',
        shouldShowSeparator && 'border-b',
        isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
      )}
    >
      {tagsProps.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {tagsProps.map(({ text, bgColor }) => (
            <PaymentProviderTag key={text} text={text} bgColor={bgColor} />
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center w-full">
        <TopUpProviderIcon providerId={value.id} />

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between text-gray-700 text-lg leading-tight w-full">
            <span>{value.name}</span>
            <span>{outputAmountStr}</span>
          </div>
          <div className="flex justify-between">
            <MoneyRange
              minAmount={value.minInputAmount}
              maxAmount={value.maxInputAmount}
              currencySymbol={value.inputSymbol}
              decimalPlaces={value.inputDecimals ?? 2}
            />
            <span className="text-xs text-gray-600 leading-relaxed">{inputAmountStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
