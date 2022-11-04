import React, { useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { t } from 'lib/i18n';

export const useCardNumberInput = (isFormSubmitted: boolean) => {
  const [value, setValue] = useState('');
  const [customError, setCustomError] = useState<string | undefined>(undefined);

  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const error = useMemo(() => {
    if (isDefined(customError)) {
      return customError;
    }

    if (isTouched || isFormSubmitted) {
      if (!isDefined(value)) {
        return t('required');
      }

      if (value.length !== 19) {
        return t('cardNumberLengthValidation');
      }

      if (!checkLuhn(value)) {
        return t('cardNumberIsInvalid');
      }
    }

    return undefined;
  }, [value, customError, isFormSubmitted, isTouched]);

  const isValid = !isDefined(error);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomError(undefined);
    setValue(event.target.value);
  };
  const onBlur = () => {
    setIsFocused(false);
    setIsTouched(true);
  };
  const onFocus = () => setIsFocused(true);

  return {
    value,
    error,
    isValid,
    isTouched,
    isFocused,
    onBlur,
    onFocus,
    onChange,
    setCustomError
  };
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
