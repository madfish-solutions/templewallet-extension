import React, { forwardRef, useMemo } from 'react';

import clsx from 'clsx';

import { setTestID } from 'lib/analytics';

import { CheckboxProps, useCheckboxHooks } from './Checkbox';

interface Props extends CheckboxProps {
  small?: boolean;
}

export const ToggleSwitch = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { errored = false, disabled, small, testID, ...rest } = props;

  const { localChecked, localFocused, handleChange, handleFocus, handleBlur } = useCheckboxHooks(props);

  const containerClassName = useMemo(
    () =>
      clsx(
        'shrink-0',
        small ? 'h-4 w-8 p-px rounded-md' : 'h-6 w-12 p-0.5 rounded-lg',
        disabled ? 'bg-disable' : localChecked ? (small ? 'bg-secondary' : 'bg-primary') : 'bg-lines',
        !disabled && 'cursor-pointer',
        // Other styles, not designed yet
        // 'disable-outline-for-click',
        (() => {
          // if (localChecked) return;
          if (localFocused) return 'outline outline-1 outline-offset-1 outline-secondary-low';
          if (errored) return 'outline outline-1 outline-offset-1 outline-red-400';
          return;
        })()
      ),
    [localChecked, localFocused, errored, disabled, small]
  );

  const knobClassName = useMemo(
    () =>
      clsx(
        'absolute h-full shadow-drop duration-300 ease-out',
        small ? 'w-4 rounded-5' : 'w-6 rounded-md',
        disabled ? 'bg-lines' : 'bg-white',
        (() => {
          if (localChecked) return small ? 'left-3.5 right-0' : 'left-5 right-0';

          return small ? 'left-0 right-3.5' : 'left-0 right-5';
        })()
      ),
    [localChecked, disabled, small]
  );

  return (
    <label className={containerClassName} {...setTestID(testID)}>
      <div className="w-full h-full relative">
        <input
          {...rest}
          ref={ref}
          type="checkbox"
          className="sr-only"
          disabled={disabled}
          checked={localChecked}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Knob */}
        <div className={knobClassName} />
      </div>
    </label>
  );
});
