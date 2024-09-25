import React, { ReactNode, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { FieldError, FormContextValues } from 'react-hook-form';

import { FormField, IconBase } from 'app/atoms';
import { TextButton } from 'app/atoms/TextButton';
import { URL_PATTERN } from 'app/defaults';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { T, t } from 'lib/i18n';
import { readClipboard } from 'lib/ui/utils';

interface UrlInputProps<K extends string, T extends Record<K, string>> {
  name: K;
  label: ReactNode;
  formContextValues: FormContextValues<T>;
  urlsToExclude: string[];
  isEditable: boolean;
  id: string;
  placeholder: string;
  submitError: ReactNode | undefined;
  showErrorBeforeSubmit?: boolean;
  textarea: boolean;
  required: boolean;
  resetSubmitError: EmptyFn;
  onChange?: SyncFn<string>;
  pasteButtonTestID: string;
  testID: string;
}

export const UrlInput = <K extends string, T extends Record<K, string>>({
  name,
  label,
  formContextValues,
  urlsToExclude,
  isEditable,
  id,
  placeholder,
  submitError,
  showErrorBeforeSubmit = false,
  textarea,
  required,
  resetSubmitError,
  onChange,
  pasteButtonTestID,
  testID
}: UrlInputProps<K, T>) => {
  const { register, errors, watch, formState, setValue, triggerValidation } = formContextValues;
  const url = watch(name);
  const isSubmitted = formState.submitCount > 0;

  const setUrl = useCallback(
    (value: string) => {
      setValue(name, value as T[K]);
      triggerValidation(name);
    },
    [name, setValue, triggerValidation]
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      resetSubmitError();
      onChange?.(e.target.value);
    },
    [resetSubmitError, onChange]
  );

  return (
    <FormField
      ref={register({
        required: required && t('required'),
        pattern: { value: URL_PATTERN, message: t('mustBeValidURL') },
        validate: value => (urlsToExclude.includes(value) ? t('mustBeUnique') : true)
      })}
      className={clsx(!isEditable && 'text-grey-1', 'resize-none')}
      cleanable={Boolean(url)}
      onClean={clearUrl}
      additonalActionButtons={additionalActionButtons}
      name={name}
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
      errorCaption={
        (isSubmitted || showErrorBeforeSubmit) && ((errors[name] as FieldError | undefined)?.message ?? submitError)
      }
      onChange={handleChange}
      disabled={!isEditable}
      testID={testID}
    />
  );
};
