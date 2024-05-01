import React, { forwardRef, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { TestIDProps, setTestID, useAnalytics, AnalyticsEventCategory } from 'lib/analytics';
import { blurHandler, checkedHandler, focusHandler } from 'lib/ui/inputHandlers';

export interface CheckboxProps
  extends TestIDProps,
    Pick<InputHTMLAttributes<HTMLInputElement>, 'name' | 'checked' | 'disabled' | 'onFocus' | 'onBlur' | 'onClick'> {
  small?: boolean;
  errored?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ToggleSwitch = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { errored = false, checked, disabled, small, onChange, onFocus, onBlur, testID, testIDProperties, ...rest },
    ref
  ) => {
    const [localChecked, setLocalChecked] = useState(() => checked ?? false);

    const { trackEvent } = useAnalytics();

    useEffect(() => {
      setLocalChecked(prevChecked => checked ?? prevChecked);
    }, [setLocalChecked, checked]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const { checked: toChecked } = event.target;
        checkedHandler(event, onChange && (() => onChange(toChecked, event)), setLocalChecked);

        testID && trackEvent(testID, AnalyticsEventCategory.CheckboxChange, { toChecked, ...testIDProperties });
      },
      [onChange, setLocalChecked, trackEvent, testID, testIDProperties]
    );

    /**
     * Focus handling
     */
    const [localFocused, setLocalFocused] = useState(false);

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => focusHandler(e, onFocus!, setLocalFocused),
      [onFocus, setLocalFocused]
    );
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => blurHandler(e, onBlur!, setLocalFocused),
      [onBlur, setLocalFocused]
    );

    const containerClassName = useMemo(
      () =>
        clsx(
          small ? 'h-4 w-8 p-px rounded-md' : 'h-6 w-12 p-0.5 rounded-lg',
          disabled ? 'bg-disable' : localChecked ? (small ? 'bg-secondary' : 'bg-primary') : 'bg-lines',
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
          small ? 'w-4 rounded-1.25' : 'w-6 rounded-md',
          disabled ? 'bg-lines' : 'bg-white',
          (() => {
            if (localChecked) return small ? 'left-3.5 right-0' : 'left-5 right-0';

            return small ? 'left-0 right-3.5' : 'left-0 right-5';
          })()
        ),
      [localChecked, disabled, small]
    );

    return (
      <div className={containerClassName} {...setTestID(testID)}>
        <div className="w-full h-full relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only"
            disabled={disabled}
            checked={localChecked}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {/* Knob */}
          <div className={knobClassName} />
        </div>
      </div>
    );
  }
);
