import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';

import { setTestID, TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';

import { ReactComponent as LockAltIcon } from '../icons/lock-alt.svg';

interface SeedWordInputProps extends TestIDProps {
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
  testID?: string;
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

  useEffect(() => {
    if (showSeed) {
      const handleLocalBlur = () => {
        inputRef.current?.blur();
        setShowSeed(false);
      };
      const t = setTimeout(() => {
        handleLocalBlur();
      }, 30_000);
      window.addEventListener('blur', handleLocalBlur);
      return () => {
        clearTimeout(t);
        window.removeEventListener('blur', handleLocalBlur);
      };
    }
    return undefined;
  }, [showSeed, inputRef, setShowSeed]);

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
    <div className={classNames('relative', 'flex flex-col items-center', isFirstAccount ? 'w-40' : 'w-44')}>
      <label htmlFor={id.toString()} className={isError ? 'text-red-600' : 'text-gray-600'}>
        <p style={{ fontSize: 14 }}>{`#${id + 1}`}</p>
      </label>
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
        className={classNames(
          'appearance-none',
          'w-full py-2 border-2',
          isError ? 'border-red-500' : 'border-gray-300',
          'focus:border-primary-orange',
          'bg-gray-100 focus:bg-transparent',
          'focus:outline-none focus:shadow-outline',
          'transition ease-in-out duration-200',
          'rounded-md',
          'text-gray-700 text-lg leading-tight',
          'placeholder-alphagray',
          'text-center',
          className
        )}
        {...setTestID(testID)}
      />
      {isWordHidden && (
        <div
          className={classNames(
            'absolute',
            'rounded-md bg-gray-200 w-full',
            'cursor-pointer flex items-center justify-center'
          )}
          style={{ top: 20, height: 44 }}
          onClick={() => {
            inputRef.current?.focus();
            setShowSeed(true);
          }}
        >
          <p className={classNames('flex items-center', 'text-gray-500 text-sm')}>
            <LockAltIcon className={classNames('mr-1', 'h-4 w-auto', 'stroke-current stroke-2')} />
            <span>
              <T id="clickToReveal" />
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
