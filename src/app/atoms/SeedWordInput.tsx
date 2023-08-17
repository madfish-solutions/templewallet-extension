import React, { FC, useCallback, useRef } from 'react';

import clsx from 'clsx';

import { TestIDProperty } from 'lib/analytics';

import { FormField } from './FormField';

export interface SeedWordInputProps extends TestIDProperty {
  id: number;
  submitted: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const SeedWordInput: FC<SeedWordInputProps> = ({ id, submitted, value, onChange, onPaste, testID }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isError = submitted ? !value : false;

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
        onChange={onChange}
        onPaste={handlePaste}
        autoComplete="off"
        smallPaddings
        fieldWrapperBottomMargin={false}
        testID={testID}
      />
    </div>
  );
};
