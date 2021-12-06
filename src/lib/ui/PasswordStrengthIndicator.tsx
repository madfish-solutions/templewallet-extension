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
};

type PasswordStrengthIndicatorItemProps = {
  isValid: boolean;
  message: ReactNode;
};

const PasswordStrengthIndicator: FC<PasswordStrengthIndicatorProps> = ({
  validation: { minChar, cases, number, specialChar }
}) => (
  <div className={'text-xs font-medium text-gray-600'}>
    <p>
      <T id="requirements" />
    </p>
    <ul className="list-disc list-inside">
      <T id="atLeast8Characters">{message => <PasswordStrengthIndicatorItem isValid={minChar} message={message} />}</T>
      <T id="mixtureOfUppercaseAndLowercaseLetters">
        {message => <PasswordStrengthIndicatorItem isValid={cases} message={message} />}
      </T>
      <T id="mixtureOfLettersAndNumbers">
        {message => <PasswordStrengthIndicatorItem isValid={number} message={message} />}
      </T>
      <T id="atLeast1SpecialCharacter">
        {message => <PasswordStrengthIndicatorItem isValid={specialChar} message={message} />}
      </T>
    </ul>
  </div>
);

const PasswordStrengthIndicatorItem: FC<PasswordStrengthIndicatorItemProps> = ({ isValid, message }) => (
  <li style={isValid ? { color: '#48bb78' } : {}}>{message}</li>
);

export default PasswordStrengthIndicator;
