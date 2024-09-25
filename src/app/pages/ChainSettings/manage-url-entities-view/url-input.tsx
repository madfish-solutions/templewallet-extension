import React, { memo } from 'react';

import { FormContextValues } from 'react-hook-form';

import { UrlInput as GenericUrlInput } from 'app/templates/UrlInput';

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

export const UrlInput = memo<UrlInputProps>(
  ({ formContextValues, urlsToExclude, isEditable, id, placeholder, submitError, resetSubmitError }) => (
    <GenericUrlInput
      name="url"
      label="URL"
      formContextValues={formContextValues}
      urlsToExclude={urlsToExclude}
      isEditable={isEditable}
      id={id}
      placeholder={placeholder}
      submitError={submitError}
      textarea
      required
      resetSubmitError={resetSubmitError}
      pasteButtonTestID={ChainSettingsSelectors.pasteUrlButton}
      testID={ChainSettingsSelectors.urlInput}
    />
  )
);
