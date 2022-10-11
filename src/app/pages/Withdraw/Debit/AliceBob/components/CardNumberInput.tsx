import React, { ChangeEvent, forwardRef, useCallback, useState } from 'react';

import classNames from 'clsx';

import { t } from 'lib/i18n/react';

import { handleNumberInput } from '../../../../Buy/utils/handleNumberInput.util';

interface Props {
  showError?: boolean;
  className?: string;
  onChange?: () => void;
  setIsError?: (v: boolean) => void;
}

export const CardNumberInput = forwardRef<HTMLInputElement, Props>(
  ({ showError = false, className, onChange, setIsError }, ref) => {
    const [cardNumber, setCardNumber] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState('');

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
          onChange();
        }

        setCardNumber(e.target.value);

        if (e.target.value.length === 20 && checkLuhn(e.target.value)) {
          setError('');
          setIsError(false);
        } else {
          setError(t('cardNumberIsNotValid'));
          setIsError(true);
        }
      },
      [onChange, setIsError]
    );

    // console.log(checkLuhn('4441 1144 4250 2546'), 'mono');
    // console.log(checkLuhn('5169 3100 0962 4437'), 'pl');

    return (
      <>
        <input
          ref={ref}
          value={handleCardDisplay(cardNumber)}
          placeholder={t('enterCardNumber')}
          style={{ color: '#1B262C' }}
          className={classNames(
            isActive && 'border-orange-500 bg-gray-100',
            'transition ease-in-out duration-200',
            'w-full border rounded-md border-gray-300',
            'p-4 leading-tight placeholder-alphagray',
            'font-inter font-normal text-sm',
            className
          )}
          type="text"
          maxLength={20}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyPress={e => handleNumberInput(e, false)}
          onChange={handleChange}
        />
        {showError && Boolean(error) && <p>{error}</p>}
      </>
    );
  }
);

const handleCardDisplay = (cardNumber: string) => {
  const rawText = [...cardNumber.split(' ').join('')];
  const creditCard: string[] = [];

  rawText.forEach((t, i) => {
    if (i % 4 === 0) creditCard.push(' ');
    creditCard.push(t);
  });

  return creditCard.join('');
};

const checkLuhn = (cardNumber: string) => {
  console.log('lugnCheck');
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
