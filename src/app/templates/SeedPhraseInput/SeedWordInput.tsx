import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import bip39WordList from 'bip39/src/wordlists/english.json';
import classNames from 'clsx';

import { FormField, FormFieldElement } from 'app/atoms/FormField';
import type { TestIDProperty } from 'lib/analytics';
import { t } from 'lib/i18n';

export interface SeedWordInputProps extends TestIDProperty {
  id: number;
  inputsRef: React.MutableRefObject<(FormFieldElement | null)[]>;
  numberOfWords: number;
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
  inputsRef,
  numberOfWords,
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
  const variantsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const [isBlur, setIsBlur] = useState(true);
  const [isError, setIsError] = useState(false);

  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [focusedVariantIndex, setFocusedVariantIndex] = useState(-1);

  const autoCompleteVariants = useMemo(
    () => (value ? bip39WordList.filter(word => word.startsWith(value)).slice(0, 3) : null),
    [value]
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
      setShowAutoComplete(true);
    } else {
      setShowAutoComplete(false);
    }
  }, [showAutoComplete, value, isBlur]);

  useEffect(() => variantsRef.current[focusedVariantIndex]?.focus(), [focusedVariantIndex]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<FormFieldElement>) => {
      if (onPaste) {
        inputsRef.current[id]?.blur();
        onPaste(e);
      }
    },
    [onPaste]
  );

  const setValueToVariant = (variant: string) => {
    if (inputsRef.current[id]) {
      onSeedWordChange(id, variant);
      setWordSpellingError('');
      inputsRef.current[id]!.value = variant;
    }
    setIsBlur(true);
  };

  const handleVariantClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, variant: string) => {
    e.preventDefault();
    setValueToVariant(variant);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (e.relatedTarget?.tagName !== BUTTON_TAG_NAME) {
      setIsBlur(true);
      setFocusedVariantIndex(-1);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!autoCompleteVariants) {
      return;
    }

    if (e.key === 'Tab' || e.key === 'Enter') {
      setValueToVariant(autoCompleteVariants[0]);

      if (id < numberOfWords - 1) {
        e.preventDefault();
        inputsRef.current[id + 1]?.focus();
      }
    }

    if (e.key === 'ArrowDown' && autoCompleteVariants.length > 1) {
      e.preventDefault();
      setFocusedVariantIndex(1);
    }
  };

  const handleVariantKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, variant: string) => {
    if (!autoCompleteVariants) {
      return;
    }

    if (e.key === 'Tab' || e.key === 'Enter') {
      setValueToVariant(variant);

      if (id < numberOfWords - 1) {
        e.preventDefault();
        inputsRef.current[id + 1]?.focus();
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (focusedVariantIndex < autoCompleteVariants.length - 1) {
        setFocusedVariantIndex(prev => prev + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focusedVariantIndex === 0) {
        inputsRef.current[id]?.focus();
        setFocusedVariantIndex(-1);
      }

      if (focusedVariantIndex > 0) {
        setFocusedVariantIndex(prev => prev - 1);
      }
    }
  };

  return (
    <div className="flex flex-col relative">
      <label htmlFor={id.toString()} className="self-center text-gray-500">
        <p style={{ fontSize: 14 }}>{`#${id + 1}`}</p>
      </label>

      <FormField
        ref={el => (inputsRef.current[id] = el)}
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
        onKeyDown={handleInputKeyDown}
      />
      {showAutoComplete && autoCompleteVariants && autoCompleteVariants.length > 0 && (
        <div className="w-full rounded-md bg-gray-100 text-gray-700 text-lg leading-tight absolute left-0 z-50 px-2 pb-2 top-18 shadow-lg flex flex-col">
          {autoCompleteVariants.map((variant, index) => (
            <button
              key={variant}
              ref={el => (variantsRef.current[index] = el)}
              className={classNames(
                'mt-2 px-3 py-2 w-full text-left rounded text-gray-600',
                'hover:text-gray-910 hover:bg-gray-200',
                'focus:text-gray-910 focus:bg-gray-200 focus:outline-none',
                index === 0 && focusedVariantIndex === -1 && 'text-gray-910 bg-gray-200'
              )}
              onClick={e => handleVariantClick(e, variant)}
              onBlur={handleBlur}
              onKeyDown={e => handleVariantKeyDown(e, variant)}
            >
              {variant}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
