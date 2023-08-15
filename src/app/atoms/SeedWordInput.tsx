import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';

import { setTestID, TestIDProperty } from 'lib/analytics';
import { useBlurElementOnTimeout } from 'lib/ui/use-blur-on-timeout';

import { FORM_FIELD_CLASS_NAME } from './FormField';
import { SecretCover } from './SecretCover';

interface SeedWordInputProps extends TestIDProperty {
  id: number;
  submitted: boolean;
  showSeed: boolean;
  isFirstAccount?: boolean;
  value?: string;
  autoComplete?: string;
  setShowSeed: (value: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export const SeedWordInput: FC<SeedWordInputProps> = ({
  id,
  submitted,
  showSeed,
  value,
  isFirstAccount,
  autoComplete = 'off',
  setShowSeed,
  onChange,
  onPaste,
  className,
  testID
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isError = submitted ? !value : false;
  const isWordHidden = useMemo(() => {
    if (focused || !value) {
      return false;
    }

    return !showSeed;
  }, [focused, showSeed, value]);

  useBlurElementOnTimeout(inputRef, showSeed, undefined, () => setShowSeed(false));

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (onPaste) {
        inputRef.current?.blur();
        onPaste(e);
      }
    },
    [onPaste]
  );

  return (
    <div className={clsx('flex flex-col', isFirstAccount ? 'w-40' : 'w-44')}>
      <label htmlFor={id.toString()} className={clsx('self-center', isError ? 'text-red-600' : 'text-gray-600')}>
        <p style={{ fontSize: 14 }}>{`#${id + 1}`}</p>
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id.toString()}
          value={value}
          autoComplete={autoComplete}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setShowSeed(false);
          }}
          className={clsx(
            FORM_FIELD_CLASS_NAME,
            'p-2 text-center',
            isError ? 'border-red-500' : 'border-gray-300',
            className
          )}
          {...setTestID(testID)}
        />

        {isWordHidden && (
          <SecretCover
            singleRow
            onClick={() => {
              inputRef.current?.focus();
              setShowSeed(true);
            }}
          />
        )}
      </div>
    </div>
  );
};
