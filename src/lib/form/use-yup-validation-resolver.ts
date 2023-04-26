import { useCallback } from 'react';

import { AnyObjectSchema, ValidationError } from 'yup';

export const useYupValidationResolver = <T extends object>(validationSchema: AnyObjectSchema) =>
  useCallback(
    async (data: T) => {
      try {
        const values = await validationSchema.validate(data, {
          abortEarly: false
        });

        return {
          values,
          errors: {}
        };
      } catch (errors) {
        return {
          values: {},
          errors: (errors as ValidationError).inner.reduce(
            (allErrors, currentError) => ({
              ...allErrors,
              [currentError.path!]: {
                type: currentError.type ?? 'validation',
                message: currentError.message
              }
            }),
            {}
          )
        };
      }
    },
    [validationSchema]
  );
