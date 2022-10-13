import React, { forwardRef, useCallback, useState } from 'react';

import classNames from 'clsx';

import { t } from 'lib/i18n/react';

import { emptyFn } from '../../../../../utils/function.utils';
import { handleNumberInput } from '../../../../Buy/utils/handleNumberInput.util';

interface Props {
  showError?: boolean;
  className?: string;
  setIsError?: (v: boolean) => void;
  setIsNotUkrainianCardError?: (v: boolean) => void;
}

export const CardNumberInput = forwardRef<HTMLInputElement, Props>(
  ({ showError = false, className, setIsError = emptyFn, setIsNotUkrainianCardError = emptyFn }, ref) => {
    const [cardNumber, setCardNumber] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState('');

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    const validateCardNumber = useCallback(
      (cardNumber: string) => {
        if (cardNumber.length === 19 && checkLuhn(cardNumber)) {
          setError('');
          setIsError(false);
        } else {
          setError(t('cardNumberIsInvalid'));
          setIsError(true);
        }

        setIsNotUkrainianCardError(false);
      },
      [setIsError, setIsNotUkrainianCardError]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const cardNumber = e.target.value;

        setBeautifiedCardNumber(cardNumber, setCardNumber, validateCardNumber);
      },
      [validateCardNumber]
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        const cardNumber = e.clipboardData.getData('text');

        setBeautifiedCardNumber(cardNumber, setCardNumber, validateCardNumber);
      },
      [validateCardNumber]
    );

    return (
      <>
        <input
          ref={ref}
          value={cardNumber}
          placeholder={t('enterCardNumber')}
          className={classNames(
            isActive && 'border-orange-500 bg-gray-100',
            showError && Boolean(error) ? 'border-red-700' : 'border-gray-300',
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
          onKeyPress={e => handleNumberInput(e, false)}
        />
        {showError && Boolean(error) && (
          <p className="font-inter font-normal text-xs text-red-700 mt-1 text-left">{error}</p>
        )}
      </>
    );
  }
);

const setBeautifiedCardNumber = (cardNumber: string, set: (v: string) => void, validate: (v: string) => void) => {
  const rawSplit = [...cardNumber.split(' ').join('')];
  const beautifiedSplit: string[] = [];

  rawSplit.forEach((t, i) => {
    if (i % 4 === 0 && beautifiedSplit.length !== 0) beautifiedSplit.push(' ');
    beautifiedSplit.push(t);
  });

  const beautifiedCardNumber = beautifiedSplit.join('');

  set(beautifiedCardNumber);
  validate(beautifiedCardNumber);
};

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
