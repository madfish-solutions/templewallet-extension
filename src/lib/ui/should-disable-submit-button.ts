import { ReactNode } from 'react';

import { FieldErrors, FieldValues, FormState } from 'react-hook-form';

interface DisableSubmitButtonConfig<T extends FieldValues = FieldValues> {
  errors: FieldErrors<T>;
  formState: FormState<T>;
  errorsBeforeSubmitFields?: string[];
  otherErrors?: ReactNode[];
  disableWhileSubmitting?: boolean;
}

// Takes `formState` besides `errors` on purpose: RHF mutates `errors` in place, so a React Compiler
// cache keyed on it alone would never recompute
export const shouldDisableSubmitButton = <T extends FieldValues = FieldValues>({
  errors,
  formState,
  errorsBeforeSubmitFields = [],
  otherErrors = [],
  disableWhileSubmitting = true
}: DisableSubmitButtonConfig<T>) => {
  const { isSubmitting, submitCount } = formState;
  const fieldsNamesWithErrors = Object.keys(errors);

  if (isSubmitting && disableWhileSubmitting) {
    return true;
  }

  return submitCount > 0
    ? fieldsNamesWithErrors.length > 0 || otherErrors.some(Boolean)
    : fieldsNamesWithErrors.some(field => errorsBeforeSubmitFields.includes(field));
};
