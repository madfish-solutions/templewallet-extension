import React, { ChangeEvent, FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n';

import { getBigErrorText, getSmallErrorText } from '../../../utils/errorText.utils';
import { handleNumberInput } from '../../../utils/handleNumberInput.util';
import { CurrencyComponent } from './CurrencyComponent';

interface Props {
  currency: string;
  onChangeInputHandler?: (value: ChangeEvent<HTMLInputElement>) => void;
  value?: number;
  disabled?: boolean;
  readOnly?: boolean;
  minAmount?: string;
  maxAmount?: string;
  isMinAmountError?: boolean;
  isMaxAmountError?: boolean;
  isCurrencyAvailable?: boolean;
}

export const TopUpInput: FC<Props> = ({
  currency,
  value,
  disabled,
  readOnly = false,
  onChangeInputHandler,
  minAmount,
  maxAmount,
  isMinAmountError,
  isMaxAmountError
}) => {
  const minAmountErrorClassName = getBigErrorText(isMinAmountError);
  const maxAmountErrorClassName = getBigErrorText(isMaxAmountError);
  return (
    <>
      <div className="flex justify-between items-baseline">
        <p className={classNames(getSmallErrorText(isMinAmountError))}>
          <>
            <T id="min" />
            <span className={classNames(minAmountErrorClassName, 'text-sm')}> {minAmount}</span>{' '}
            <span className={classNames(minAmountErrorClassName, 'text-xs')}>{currency}</span>
          </>
        </p>
        {maxAmount && (
          <p className={classNames(getSmallErrorText(isMaxAmountError))}>
            <T id="max" />
            {': '}
            <span className={classNames(maxAmountErrorClassName, 'text-sm')}>{maxAmount}</span>{' '}
            <span className={classNames(maxAmountErrorClassName, 'text-xs')}>{currency}</span>
          </p>
        )}
      </div>
      <div
        className="flex box-border w-full border-solid border-gray-300"
        style={{ borderWidth: 1, borderRadius: 6, height: 72 }}
      >
        <div
          className="flex justify-center items-center border-solid border-gray-300"
          style={{ borderRightWidth: 1, width: 111 }}
        >
          <CurrencyComponent label={currency} />
        </div>
        <div className="flex flex-1">
          <input
            readOnly={readOnly}
            onKeyPress={e => handleNumberInput(e)}
            value={value}
            placeholder="0.00"
            className="w-full font-inter text-right pr-1"
            style={{ fontSize: 23, borderRadius: 6 }}
            type="text"
            maxLength={15}
            disabled={disabled}
            onChange={onChangeInputHandler}
          />
        </div>
      </div>
    </>
  );
};
