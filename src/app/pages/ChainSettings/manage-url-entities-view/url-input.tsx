import React from 'react';

import { UseFormReturn } from 'react-hook-form-v7';

import { UrlInput as GenericUrlInput } from 'app/templates/UrlInput';

import { ChainSettingsSelectors } from '../selectors';

interface UrlInputProps<T extends { url: string }> {
  formReturn: UseFormReturn<T>;
  urlsToExclude: string[];
  isEditable: boolean;
  id: string;
  placeholder: string;
  submitError: string | null;
  resetSubmitError: EmptyFn;
}

export const UrlInput = <T extends { url: string }>({
  formReturn,
  urlsToExclude,
  isEditable,
  id,
  placeholder,
  submitError,
  resetSubmitError
}: UrlInputProps<T>) => (
  <GenericUrlInput
    name="url"
    label="URL"
    formReturn={formReturn}
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
);
