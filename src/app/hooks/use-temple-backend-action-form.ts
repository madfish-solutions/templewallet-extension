import { useCallback } from 'react';

import { FieldName, OnSubmit, UseFormOptions, useForm } from 'react-hook-form';

const SUBMIT_ERROR_TYPE = 'submit-error';

export const useTempleBackendActionForm = <T extends object>(
  action: (formData: T) => Promise<void>,
  submitErrorField: FieldName<T>,
  options?: UseFormOptions<T>
) => {
  const { register, handleSubmit, errors, setError, clearError, formState, ...rest } = useForm<T>(options);
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<T>>(
    async formData => {
      if (submitting) return;

      clearError(submitErrorField);
      try {
        await action(formData);
      } catch (err: any) {
        console.error(err);

        setError(submitErrorField, SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, submitErrorField, action, setError]
  );

  return {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState,
    onSubmit,
    ...rest
  };
};
