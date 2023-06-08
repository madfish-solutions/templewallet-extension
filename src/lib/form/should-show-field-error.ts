import { FormStateProxy } from 'react-hook-form';

import { isTruthy } from 'lib/utils';

export const shouldShowFieldError = <T extends object>(field: keyof T, formState: FormStateProxy<T>) =>
  isTruthy(formState.touched[field]) || formState.submitCount > 0;
