import React, { ReactNode, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { Path, PathValue, UseFormReturn } from 'react-hook-form';

import { FormField, IconBase } from 'app/atoms';
import { TextButton } from 'app/atoms/TextButton';
import { createUrlPattern } from 'app/defaults';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { T, t } from 'lib/i18n';
import { readClipboard } from 'lib/ui/utils';

// TODO: change all types if this component should be used for form values that include arrays, objects with fields etc.
interface UrlInputProps<K extends string, T extends Record<K, string>> {
  name: K;
  label: ReactNode;
  formReturn: UseFormReturn<T>;
  urlsToExclude?: string[];
  disabled?: boolean;
  isEditable: boolean;
  id: string;
  placeholder: string;
  submitError: ReactNode | undefined;
  textarea: boolean;
  required: boolean;
  resetSubmitError: EmptyFn;
  onChange?: SyncFn<string>;
  pasteButtonTestID: string;
  testID: string;
  allowHttp?: boolean;
}

export const UrlInput = <K extends string, T extends Record<K, string>>({
  name,
  label,
  formReturn,
  urlsToExclude,
  disabled,
  isEditable,
  id,
  placeholder,
  submitError,
  textarea,
  required,
  resetSubmitError,
  onChange,
  pasteButtonTestID,
  testID,
  allowHttp = false
}: UrlInputProps<K, T>) => {
  const castName = name as unknown as Path<T>;
  const { register, watch, formState, setValue } = formReturn;
  const { errors } = formState;
  const url = watch(castName);
  const fieldError = errors[castName]?.message;

  const applyValueChangeEffects = useCallback(
    (newValue: string) => {
      resetSubmitError();
      onChange?.(newValue);
    },
    [onChange, resetSubmitError]
  );

  const setUrl = useCallback(
    (value: string) => {
      setValue(castName, value as PathValue<T, Path<T>>, { shouldValidate: true });
      applyValueChangeEffects(value);
    },
    [applyValueChangeEffects, castName, setValue]
  );
  const pasteUrl = useCallback(async () => {
    try {
      setUrl(await readClipboard());
    } catch (error) {
      console.error(error);
    }
  }, [setUrl]);
  const clearUrl = useCallback(() => setUrl(''), [setUrl]);

  const additionalActionButtons = useMemo(() => {
    if (!isEditable) {
      return textarea ? <IconBase size={16} Icon={LockFillIcon} className="text-grey-3" /> : null;
    }

    return url || !textarea ? null : (
      <TextButton color="blue" Icon={PasteFillIcon} onClick={pasteUrl} testID={pasteButtonTestID}>
        <T id="paste" />
      </TextButton>
    );
  }, [isEditable, pasteButtonTestID, pasteUrl, textarea, url]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => applyValueChangeEffects(e.target.value),
    [applyValueChangeEffects]
  );

  const errorCaption = useMemo(
    () => (typeof fieldError === 'string' ? fieldError : submitError),
    [fieldError, submitError]
  );

  return (
    <FormField
      {...register(
        castName,
        isEditable
          ? {
              required: required && t('required'),
              pattern: { value: createUrlPattern(allowHttp), message: t('mustBeValidURL') },
              validate: (value: PathValue<T, Path<T>>) =>
                urlsToExclude?.includes(value as string) ? t('mustBeUnique') : true,
              onChange: handleChange
            }
          : undefined
      )}
      className={clsx(!isEditable && 'text-grey-1', 'resize-none')}
      cleanable={Boolean(url) && (!textarea || isEditable)}
      onClean={clearUrl}
      additionalActionButtons={additionalActionButtons}
      labelContainerClassName="w-full flex justify-between items-center"
      label={
        required ? (
          label
        ) : (
          <>
            {label}
            <span className="text-font-description font-normal text-grey-2">
              <T id="optionalComment" />
            </span>
          </>
        )
      }
      id={id}
      placeholder={placeholder}
      textarea={textarea}
      rows={textarea ? 3 : undefined}
      errorCaption={errorCaption}
      disabled={!isEditable || disabled}
      testID={testID}
    />
  );
};
