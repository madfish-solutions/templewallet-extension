import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { FormField, FormFieldElement } from 'app/atoms/FormField';
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
  testID
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isError = submitted ? !value : false;
  const [onBlur, setOnBlur] = useState(true);
  const errorCheckRef = useRef<boolean | undefined>(undefined);

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
    }
  }, [value, onBlur, errorCheckRef, setWordSpellingError]);

  return (
    <div className="flex flex-col">
      <label htmlFor={id.toString()} className={clsx('self-center', isError ? 'text-red-600' : 'text-gray-600')}>
        <p style={{ fontSize: 14 }}>{`#${id + 1}`}</p>
      </label>

      <FormField
        ref={inputRef}
        type="password"
        id={id.toString()}
        value={value}
        onChange={onChange}
        onBlur={() => setOnBlur(true)}
        onFocus={() => setOnBlur(false)}
        onPaste={handlePaste}
        revealRef={revealRef}
        onReveal={onReveal}
        autoComplete="off"
        smallPaddings
        fieldWrapperBottomMargin={false}
        testID={testID}
        errorCaption={errorCheckRef.current}
      />
    </div>
  );
};
