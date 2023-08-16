import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';

import { setTestID, TestIDProperty } from 'lib/analytics';
import { useBlurElementOnTimeout } from 'lib/ui/use-blur-on-timeout';

import { FORM_FIELD_CLASS_NAME, FormField } from './FormField';
import { SecretCover } from './SecretCover';

interface SeedWordInputProps extends TestIDProperty {
  id: number;
  submitted: boolean;
  showSeed: boolean;
  isFirstAccount?: boolean;
  value?: string;
  setShowSeed: (value: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
}

export const SeedWordInput: FC<SeedWordInputProps> = ({
  id,
  submitted,
  showSeed,
  value,
  isFirstAccount,
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void onChange?.(e),
    [onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (onPaste) {
        inputRef.current?.blur();
        onPaste(e);
      }
    },
    [onPaste]
  );

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
        onChange={handleChange}
        onPaste={handlePaste}
        autoComplete="off"
        smallPaddings
        fieldWrapperBottomMargin={false}
        // name="password"
        // label={
        //   <>
        //     <T id="password" />{' '}
        //     <span className="text-sm font-light text-gray-600">
        //       <T id="optionalComment" />
        //     </span>
        //   </>
        // }
        // labelDescription={t('passwordInputDescription')}
        // placeholder="*********"
        // errorCaption={errors.password?.message}
        // containerClassName="mb-6"
        testID={testID}
      />
    </div>
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
          autoComplete="off"
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
