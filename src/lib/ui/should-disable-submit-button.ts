import { ReactNode } from 'react';

import { FormContextValues } from 'react-hook-form';

interface DisableSubmitButtonConfig {
  errors: FormContextValues['errors'];
  formState: FormContextValues['formState'];
  errorsBeforeSubmitFields?: string[];
  otherErrors?: ReactNode[];
  disableWhileSubmitting?: boolean;
}

export const shouldDisableSubmitButton = ({
  errors,
  formState,
  errorsBeforeSubmitFields = [],
  otherErrors = [],
  disableWhileSubmitting = true
}: DisableSubmitButtonConfig) => {
  const { isSubmitting, submitCount } = formState;
  const fieldsNamesWithErrors = Object.keys(errors);

  if (isSubmitting && disableWhileSubmitting) {
    return true;
  }

  return submitCount > 0
    ? fieldsNamesWithErrors.length > 0 || otherErrors.some(Boolean)
    : fieldsNamesWithErrors.some(field => errorsBeforeSubmitFields.includes(field));
};
