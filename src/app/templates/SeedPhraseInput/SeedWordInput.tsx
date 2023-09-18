import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';

import { FormField, FormFieldElement, FORM_FIELD_CLASS_NAME } from 'app/atoms/FormField';
import { bip39WordList } from 'app/pages/ImportAccount/constants';
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
  const isError = submitted ? !value : false;
  const [onBlur, setOnBlur] = useState(true);
  const errorCheckRef = useRef<boolean | undefined>(undefined);
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
    if (value && !bip39WordList.includes(value) && onBlur) {
      setWordSpellingError(t('mnemonicWordsError'));
      errorCheckRef.current = true;
    } else {
      errorCheckRef.current = undefined;
      setWordSpellingError('');
    }
  }, [value, onBlur, errorCheckRef, setWordSpellingError]);

  useEffect(() => {
    if (!onBlur && value && value.length > 1) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  }, [showAutocomplete, value, onBlur]);

  const autocompleteVariants = useMemo(
    () => (value ? bip39WordList.filter(word => word.startsWith(value)) : null),
    [value]
  );

  return (
    <div className="flex flex-col relative">
      <label htmlFor={id.toString()} className={clsx('self-center', isError ? 'text-red-600' : 'text-gray-600')}>
        <p style={{ fontSize: 14 }}>{`#${id + 1}`}</p>
      </label>

      <FormField
        ref={inputRef}
        type="password"
        id={id.toString()}
        onChange={onChange}
        // delay for ref update works properly
        onBlur={e => {
          if (e.relatedTarget === null) {
            setOnBlur(true);
          }
        }}
        value={value}
        onFocus={() => setOnBlur(false)}
        onPaste={handlePaste}
        revealRef={revealRef}
        onReveal={onReveal}
        autoComplete="off"
        smallPaddings
        fieldWrapperBottomMargin={false}
        testID={testID}
        errorCaption={errorCheckRef.current}
        style={{ backgroundColor: 'white' }}
      />
      {showAutocomplete && autocompleteVariants && autocompleteVariants.length > 0 && (
        <div
          className={clsx(
            FORM_FIELD_CLASS_NAME,
            'absolute left-0 z-50 px-2 items-center top-18 shadow-lg flex flex-col'
          )}
        >
          {autocompleteVariants?.map((variant, index) => {
            return (
              <div className="hover:bg-gray-200 w-full rounded focus:bg-gray-200" key={index}>
                <button
                  className="my-2 px-3 py-2 w-full"
                  onClick={e => {
                    e.preventDefault();
                    if (inputRef && inputRef.current) {
                      onSeedWordChange(id, variant);
                      setWordSpellingError('');
                      inputRef.current.value = variant;
                    }
                    setOnBlur(true);
                  }}
                  onBlur={e => {
                    if (e.relatedTarget === null) {
                      setOnBlur(true);
                    }
                  }}
                >
                  {variant}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
