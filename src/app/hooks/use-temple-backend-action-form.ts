import { useCallback } from 'react';

import { FieldPath, SubmitHandler, UseFormProps, useForm } from 'react-hook-form-v7';

const SUBMIT_ERROR_TYPE = 'submit-error';

export const useTempleBackendActionForm = <T extends object>(
  action: (formData: T) => Promise<void>,
  submitErrorField: FieldPath<T>,
  options?: UseFormProps<T>
) => {
  const { register, handleSubmit, setError, clearErrors, formState, ...rest } = useForm<T>(options);
  const { isSubmitting, errors } = formState;

  const onSubmit = useCallback<SubmitHandler<T>>(
    async formData => {
      if (isSubmitting) return;

      clearErrors(submitErrorField);
      try {
        await action(formData);
      } catch (err: any) {
        console.error(err);

        setError(submitErrorField, { type: SUBMIT_ERROR_TYPE, message: err.message });
      }
    },
    [isSubmitting, clearErrors, submitErrorField, action, setError]
  );

  return {
    register,
    handleSubmit,
    errors,
    setError,
    clearErrors,
    formState,
    onSubmit,
    ...rest
  };
};
