import React, { forwardRef, useCallback, useState } from 'react';

import classNames from 'clsx';
import MaskedInput from 'react-text-mask';

import { emptyFn } from 'app/utils/function.utils';
import { t } from 'lib/i18n/react';

const NUMBERS_WITH_SPACES_REGEX = [
  /[1-9]/,
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  /\d/,
  /\d/
];

interface Props {
  className?: string;
  error?: string;
  setError?: (v: string) => void;
  setIsNotUkrainianCardError?: (v: boolean) => void;
}

export const CardNumberInput = forwardRef<MaskedInput, Props>(
  ({ className, error = '', setError = emptyFn, setIsNotUkrainianCardError = emptyFn }, ref) => {
    const [cardNumber, setCardNumber] = useState('');
    const [isActive, setIsActive] = useState(false);

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    const validateCardNumber = useCallback(
      (cardNumber: string) => {
        if (cardNumber.length === 19 && checkLuhn(cardNumber)) {
          setError('');
        } else {
          setError(t('cardNumberIsInvalid'));
        }

        setIsNotUkrainianCardError(false);
      },
      [setError, setIsNotUkrainianCardError]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const cardNumber = e.target.value;

        setCardNumber(cardNumber);
        validateCardNumber(cardNumber);
      },
      [validateCardNumber]
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        const cardNumber = e.clipboardData.getData('text');

        setCardNumber(cardNumber);
        validateCardNumber(cardNumber);
      },
      [validateCardNumber]
    );

    return (
      <>
        <MaskedInput
          ref={ref}
          value={cardNumber}
          mask={NUMBERS_WITH_SPACES_REGEX}
          guide={false}
          placeholder={t('enterCardNumber')}
          className={classNames(
            isActive && 'border-orange-500 bg-gray-100',
            Boolean(error) ? 'border-red-700' : 'border-gray-300',
            'text-gray-910 transition ease-in-out duration-200',
            'w-full border rounded-md',
            'p-4 leading-tight placeholder-alphagray',
            'font-inter font-normal text-sm',
            className
          )}
          type="text"
          maxLength={19}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onPaste={handlePaste}
          onChange={handleChange}
        />
        {Boolean(error) && <p className="font-inter font-normal text-xs text-red-700 mt-1 text-left">{error}</p>}
      </>
    );
  }
);

// checks card number validity using Luhn algorithm
const checkLuhn = (cardNumber: string) => {
  if (/[^0-9-\s]+/.test(cardNumber)) return false;

  let nCheck = 0,
    nDigit = 0,
    bEven = false;
  cardNumber = cardNumber.replace(/\D/g, '');

  for (let n = cardNumber.length - 1; n >= 0; n--) {
    const cDigit = cardNumber.charAt(n);
    nDigit = parseInt(cDigit, 10);

    if (bEven) {
      if ((nDigit *= 2) > 9) nDigit -= 9;
    }

    nCheck += nDigit;
    bEven = !bEven;
  }

  return nCheck % 10 === 0;
};
