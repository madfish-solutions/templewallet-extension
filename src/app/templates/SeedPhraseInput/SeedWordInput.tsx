import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import bip39WordList from 'bip39/src/wordlists/english.json';

import { FormField, FormFieldElement } from 'app/atoms/FormField';
import type { TestIDProperty } from 'lib/analytics';
import { t } from 'lib/i18n';

export interface SeedWordInputProps extends TestIDProperty {
  id: number;
  submitted: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<FormFieldElement>) => void;
  onPaste?: (e: React.ClipboardEvent<FormFieldElement>) => void;
  revealRef: unknown;
  onReveal: EmptyFn;
  setWordSpellingError: (e: string) => void;
  onSeedWordChange: (index: number, value: string) => void;
}

const BUTTON_TAG_NAME = 'BUTTON';

export const SeedWordInput: FC<SeedWordInputProps> = ({
  id,
  submitted,
  value,
  onChange,
  onPaste,
  revealRef,
  onReveal,
  setWordSpellingError,
  onSeedWordChange,
  testID
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isBlur, setIsBlur] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<FormFieldElement>) => {
      if (onPaste) {
        inputRef.current?.blur();
        onPaste(e);
      }
    },
    [onPaste]
  );

  useEffect(() => {
    if (submitted && !value) {
      setIsError(true);
      return;
    }

    if (value && !bip39WordList.includes(value)) {
      setWordSpellingError(t('mnemonicWordsError'));
      setIsError(true);
    } else {
      setIsError(false);
      setWordSpellingError('');
    }
  }, [submitted, value, setWordSpellingError]);

  useEffect(() => {
    if (!isBlur && value && value.length > 1) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, [showAutocomplete, value, isBlur]);

  const autocompleteVariants = useMemo(
    () => (value ? bip39WordList.filter(word => word.startsWith(value)).slice(0, 3) : null),
    [value]
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, variant: string) => {
    e.preventDefault();
    if (inputRef && inputRef.current) {
      onSeedWordChange(id, variant);
      setWordSpellingError('');
      inputRef.current.value = variant;
    }
    setIsBlur(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (e.relatedTarget?.tagName !== BUTTON_TAG_NAME) {
      setIsBlur(true);
    }
  };

  return (
    <div className="flex flex-col relative">
      <label htmlFor={id.toString()} className="self-center text-gray-500">
        <p style={{ fontSize: 14 }}>{`#${id + 1}`}</p>
      </label>

      <FormField
        ref={inputRef}
        type="password"
        id={id.toString()}
        onChange={onChange}
        onBlur={handleBlur}
        value={value}
        onFocus={() => setIsBlur(false)}
        onPaste={handlePaste}
        revealRef={revealRef}
        onReveal={onReveal}
        autoComplete="off"
        smallPaddings
        fieldWrapperBottomMargin={false}
        testID={testID}
        errorCaption={isError}
        style={{ backgroundColor: 'white' }}
      />
      {showAutocomplete && autocompleteVariants && autocompleteVariants.length > 0 && (
        <div className="w-full rounded-md bg-gray-100 text-gray-700 text-lg leading-tight absolute left-0 z-50 px-2 pb-2 top-18 shadow-lg flex flex-col">
          {autocompleteVariants.map(variant => (
            <div className="mt-2 hover:bg-gray-200 rounded w-full focus:bg-gray-200" key={variant}>
              <button
                className="px-3 py-2 w-full text-left rounded text-gray-600 hover:text-gray-910 focus:text-gray-910 focus:bg-gray-200 focus:outline-none"
                onClick={e => handleClick(e, variant)}
                onBlur={handleBlur}
              >
                {variant}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
