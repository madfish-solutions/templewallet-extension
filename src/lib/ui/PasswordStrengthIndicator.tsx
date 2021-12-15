import React, { FC } from 'react';

import { T } from '../i18n/react';
import PasswordStrengthIndicatorItem from './PasswordStrengthIndicatorItem';

export interface PasswordValidation {
  minChar: boolean;
  cases: boolean;
  number: boolean;
  specialChar: boolean;
}

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidation;
  isPasswordError?: boolean;
}

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

export default PasswordStrengthIndicator;
