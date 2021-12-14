import React, { FC, ReactNode } from 'react';

import { T } from '../i18n/react';

export interface PasswordValidation {
  minChar: boolean;
  cases: boolean;
  number: boolean;
  specialChar: boolean;
}

type PasswordStrengthIndicatorProps = {
  validation: PasswordValidation;
  isPasswordError?: boolean;
};

type PasswordStrengthIndicatorItemProps = {
  isValid: boolean;
  message: ReactNode;
  title?: boolean;
  noColor?: boolean;
};

const PasswordStrengthIndicator: FC<PasswordStrengthIndicatorProps> = ({
  validation: { minChar, cases, number, specialChar },
  isPasswordError = false
}) => (
  <div className={'text-xs font-medium text-gray-600'}>
    <T id="requirements">
      {message => (
        <PasswordStrengthIndicatorItem
          isValid={minChar && cases && number && specialChar}
          message={message}
          noColor={!isPasswordError}
          title
        />
      )}
    </T>
    <ul className="list-disc list-inside">
      <T id="atLeast8Characters">
        {message => <PasswordStrengthIndicatorItem isValid={minChar} message={message} noColor={!isPasswordError} />}
      </T>
      <T id="mixtureOfUppercaseAndLowercaseLetters">
        {message => <PasswordStrengthIndicatorItem isValid={cases} message={message} noColor={!isPasswordError} />}
      </T>
      <T id="mixtureOfLettersAndNumbers">
        {message => <PasswordStrengthIndicatorItem isValid={number} message={message} noColor={!isPasswordError} />}
      </T>
      <T id="atLeast1SpecialCharacter">
        {message => <PasswordStrengthIndicatorItem isValid={specialChar} message={message} noColor />}
      </T>
    </ul>
  </div>
);

const PasswordStrengthIndicatorItem: FC<PasswordStrengthIndicatorItemProps> = ({
  isValid,
  message,
  title = false,
  noColor = false
}) => {
  const style = isValid ? { color: '#48bb78' } : noColor ? {} : { color: '#e53e3e' };

  return title ? <p style={style}>{message}</p> : <li style={style}>{message}</li>;
};

export default PasswordStrengthIndicator;
