import React, { FC, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { FormContextValues } from 'react-hook-form';

import { FormField, IconBase } from 'app/atoms';
import { TextButton } from 'app/atoms/TextButton';
import { URL_PATTERN } from 'app/defaults';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { T, t } from 'lib/i18n';
import { readClipboard } from 'lib/ui/utils';

import { ChainSettingsSelectors } from '../selectors';

type UrlFormContextValues = FormContextValues<{ url: string }>;

interface UrlInputProps {
  formContextValues: UrlFormContextValues;
  urlsToExclude: string[];
  isEditable: boolean;
  id: string;
  placeholder: string;
  submitError: string | null;
  resetSubmitError: EmptyFn;
}

export const UrlInput: FC<UrlInputProps> = ({
  formContextValues,
  urlsToExclude,
  isEditable,
  id,
  placeholder,
  submitError,
  resetSubmitError
}) => {
  const { register, errors, watch, formState, setValue, triggerValidation } = formContextValues;
  const url = watch('url');
  const isSubmitted = formState.submitCount > 0;

  const setUrl = useCallback(
    (value: string) => {
      setValue('url', value);
      triggerValidation('url');
    },
    [setValue, triggerValidation]
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
      return <IconBase size={16} Icon={LockFillIcon} className="text-grey-3" />;
    }

    return url ? (
      <TextButton color="grey" Icon={XCircleFillIcon} onClick={clearUrl} testID={ChainSettingsSelectors.clearUrlButton}>
        <T id="clear" />
      </TextButton>
    ) : (
      <TextButton color="blue" Icon={PasteFillIcon} onClick={pasteUrl} testID={ChainSettingsSelectors.pasteUrlButton}>
        <T id="paste" />
      </TextButton>
    );
  }, [clearUrl, isEditable, pasteUrl, url]);

  return (
    <FormField
      ref={register({
        required: t('required'),
        pattern: { value: URL_PATTERN, message: t('mustBeValidURL') },
        validate: value => (urlsToExclude.includes(value) ? t('mustBeUnique') : true)
      })}
      className={clsx(!isEditable && 'text-grey-1', 'resize-none')}
      additonalActionButtons={additionalActionButtons}
      name="url"
      label="URL"
      id={id}
      placeholder={placeholder}
      textarea
      rows={3}
      errorCaption={isSubmitted && (errors.url?.message ?? submitError)}
      onChange={resetSubmitError}
      disabled={!isEditable}
      testID={ChainSettingsSelectors.urlInput}
    />
  );
};
