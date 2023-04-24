import React, { forwardRef } from 'react';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { T } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';
import { isDefined } from 'lib/utils/is-defined';

import { TopUpProviderIcon } from '../TopUpProviderIcon';
import { MoneyRange } from './MoneyRange';
import { PaymentProviderInputProps } from './types';

interface Props extends PopperRenderProps, Pick<PaymentProviderInputProps, 'value' | 'options'> {}

export const PaymentProviderInputHeader = forwardRef<HTMLDivElement, Props>(({ value, options, toggleOpened }, ref) => {
  const currentOption = options.find(option => option.id === value);

  return (
    <div
      className="w-full border-gray-300 border flex flex-row items-center p-2 pr-4 gap-2 rounded-md cursor-pointer"
      ref={ref}
      onClick={toggleOpened}
    >
      <TopUpProviderIcon providerId={value} />
      <div className="flex flex-1 flex-col">
        {isDefined(currentOption) ? (
          <>
            <span className="font-normal text-ulg text-gray-700 leading-tight">{currentOption.name}</span>
            <MoneyRange
              minAmount={currentOption.minInputAmount}
              maxAmount={currentOption.maxInputAmount}
              currencySymbol={currentOption.inputSymbol}
              decimalPlaces={currentOption.inputDecimals ?? 2}
            />
          </>
        ) : (
          <span className="font-medium text-sm leading-tight text-gray-500">
            <T id="selectPaymentProvider" />
          </span>
        )}
      </div>
      <ChevronDownIcon className="w-4 h-4 text-gray-600 stroke-current" />
    </div>
  );
});
