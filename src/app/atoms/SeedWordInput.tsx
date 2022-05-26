import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import SeedWordBanner from './assets/seed-word-banner.png';

interface SeedWordInputProps {
  id: number;
  showSeed: boolean;
  value?: string;
  autoComplete?: string;
  setShowSeed: (value: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export const SeedWordInput: FC<SeedWordInputProps> = ({
  id,
  showSeed,
  value,
  autoComplete = 'off',
  setShowSeed,
  onChange,
  onPaste,
  className
}) => {
  const [isChanged, setIsChanged] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isError = !value && isChanged;

  useEffect(() => {
    if (showSeed && focused) {
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
  }, [showSeed, focused, inputRef, setShowSeed]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        setIsChanged(true);
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
    <div
      className={classNames('relative', 'flex flex-col items-center', 'w-40')}
      onClick={() => inputRef.current?.focus()}
    >
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
      />
      {!showSeed && !isError && (
        <img
          src={SeedWordBanner}
          alt="SeedWordBanner"
          className={classNames('absolute', 'rounded-md', 'cursor-text')}
          style={{ top: 18 }}
          onClick={() => setShowSeed(true)}
        />
      )}
    </div>
  );
};
