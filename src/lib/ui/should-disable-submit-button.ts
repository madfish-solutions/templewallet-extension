import { ReactNode } from 'react';

import { FormContextValues } from 'react-hook-form';

export const shouldDisableSubmitButton = (
  errors: FormContextValues['errors'],
  formState: FormContextValues['formState'],
  ...otherErrors: ReactNode[]
) => {
  const { isSubmitting, submitCount } = formState;

  return isSubmitting || (submitCount > 0 && (Object.keys(errors).length > 0 || otherErrors.some(Boolean)));
};
