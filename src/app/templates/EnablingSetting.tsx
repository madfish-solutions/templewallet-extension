import React from 'react';

import { FormCheckboxProps, FormCheckbox } from 'app/atoms';
import { T, TID, t, ReactSubstitutions } from 'lib/i18n';

interface Props extends Pick<FormCheckboxProps, 'onChange' | 'testID' | 'errorCaption'> {
  titleI18nKey: TID;
  titleSubstituions?: ReactSubstitutions;
  descriptionI18nKey: TID;
  descriptionSubstitutions?: ReactSubstitutions;
  enabled?: boolean;
}

/** @deprecated */
export const EnablingSetting = ({
  titleI18nKey,
  titleSubstituions,
  descriptionI18nKey,
  descriptionSubstitutions,
  enabled,
  onChange,
  testID,
  errorCaption
}: Props) => (
  <>
    <div className="mb-4 leading-tight flex flex-col">
      <span className="text-base font-semibold text-gray-700">
        <T id={titleI18nKey} substitutions={titleSubstituions} />
      </span>

      <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
        <T id={descriptionI18nKey} substitutions={descriptionSubstitutions} />
      </span>
    </div>

    <FormCheckbox
      checked={enabled}
      onChange={onChange}
      label={t(enabled ? 'enabled' : 'disabled')}
      containerClassName="mb-4"
      testID={testID}
      errorCaption={errorCaption}
    />
  </>
);
