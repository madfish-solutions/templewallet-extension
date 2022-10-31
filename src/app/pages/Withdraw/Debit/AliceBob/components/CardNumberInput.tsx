import React, { FC, useCallback, useMemo, useState } from 'react';

import { OnEventFn } from '@rnw-community/shared';
import classNames from 'clsx';
import MaskedInput from 'react-text-mask';

import { emptyFn } from 'app/utils/function.utils';
import { t } from 'lib/i18n/react';

interface Props {
  value: string;
  isFormSubmitted: boolean;
  onChange: OnEventFn<string>;

  className?: string;
  error?: string;
  setError?: (v: string) => void;
  setIsNotUkrainianCardError?: (v: boolean) => void;
}

export const CardNumberInput: FC<Props> = ({
  value,
  onChange,

  className,
  error = '',
  setError = emptyFn,
  setIsNotUkrainianCardError = emptyFn
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const error = useMemo(() => {}, []);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const validateCardNumber = useCallback(
    (cardNumber: string) => {
      console.log(cardNumber);
      console.log(cardNumber.length);
      console.log(checkLuhn(cardNumber));
      if (cardNumber.length === 19 && checkLuhn(cardNumber)) {
        setError('');
      } else {
        setError(t('cardNumberIsInvalid'));
      }

      setIsNotUkrainianCardError(false);
    },
    [setError, setIsNotUkrainianCardError]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cardNumber = e.target.value;

    console.log('handleChange', cardNumber);
    onChange(cardNumber);
    validateCardNumber(cardNumber);
  };

  return (
    <>
      <MaskedInput
        type="text"
        guide={true}
        value={value}
        mask={NUMBERS_WITH_SPACES_REGEX}
        placeholder={t('enterCardNumber')}
        className={classNames(
          isFocused && 'border-orange-500 bg-gray-100',
          Boolean(error) ? 'border-red-700' : 'border-gray-300',
          'text-gray-910 transition ease-in-out duration-200',
          'w-full border rounded-md',
          'p-4 leading-tight placeholder-alphagray',
          'font-inter font-normal text-sm',
          className
        )}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={handleChange}
      />
      {Boolean(error) && <p className="font-inter font-normal text-xs text-red-700 mt-1 text-left">{error}</p>}
    </>
  );
};

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
