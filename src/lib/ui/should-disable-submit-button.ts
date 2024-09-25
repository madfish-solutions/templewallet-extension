import { ReactNode } from 'react';

import { FormContextValues } from 'react-hook-form';

export const shouldDisableSubmitButton = (
  errors: FormContextValues['errors'],
  formState: FormContextValues['formState'],
  errorsBeforeSubmitFields: string[],
  ...otherErrors: ReactNode[]
) => {
  const { isSubmitting, submitCount } = formState;
  const fieldsNamesWithErrors = Object.keys(errors);

  if (isSubmitting) {
    return true;
  }

  return submitCount > 0
    ? fieldsNamesWithErrors.length > 0 || otherErrors.some(Boolean)
    : fieldsNamesWithErrors.some(field => errorsBeforeSubmitFields.includes(field));
};
