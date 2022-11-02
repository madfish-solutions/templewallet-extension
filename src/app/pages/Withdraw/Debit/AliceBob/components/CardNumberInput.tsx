import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';
import MaskedInput, { MaskedInputProps } from 'react-text-mask';

import { t } from 'lib/i18n/react';

interface Props extends Pick<MaskedInputProps, 'value' | 'onBlur' | 'onFocus' | 'onChange'> {
  error?: string;
  isFocused: boolean;
}

export const CardNumberInput: FC<Props> = ({ value, error, isFocused, onBlur, onFocus, onChange }) => (
  <>
    <MaskedInput
      type="text"
      guide={false}
      value={value}
      mask={NUMBERS_WITH_SPACES_REGEX}
      placeholder={t('enterCardNumber')}
      className={classNames(
        isFocused && 'border-orange-500 bg-gray-100',
        isDefined(error) ? 'border-red-700' : 'border-gray-300',
        'text-gray-910 transition ease-in-out duration-200',
        'w-full border rounded-md',
        'p-4 leading-tight placeholder-alphagray',
        'font-inter font-normal text-sm'
      )}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={onChange}
    />
    {isDefined(error) && <p className="font-inter font-normal text-xs text-red-700 mt-1 text-left">{error}</p>}
  </>
);

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
