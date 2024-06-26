import React, { forwardRef, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { ReactComponent as OkIcon } from 'app/icons/checkbox-ok.svg';
import { TestIDProps, setTestID, useAnalytics, AnalyticsEventCategory } from 'lib/analytics';
import { blurHandler, checkedHandler, focusHandler } from 'lib/ui/inputHandlers';

export interface CheckboxProps
  extends TestIDProps,
    Pick<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'checked' | 'className' | 'onFocus' | 'onBlur' | 'onClick' | 'disabled'
    > {
  errored?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface Props extends CheckboxProps {
  overrideClassNames?: string;
}

const Checkbox = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { overrideClassNames, errored = false, className, testID, disabled, ...rest } = props;

  const { localChecked, localFocused, handleChange, handleFocus, handleBlur } = useCheckboxHooks(props);

  const classNameMemo = useMemo(
    () =>
      clsx(
        'flex justify-center items-center flex-shrink-0',
        'text-white border overflow-hidden',
        'transition ease-in-out duration-200 disable-outline-for-click',
        localChecked ? 'bg-primary-orange' : 'bg-black-40',
        localFocused && 'shadow-outline',
        (() => {
          switch (true) {
            case localChecked:
              return 'border-primary-orange';
            case localFocused:
              return 'border-primary-orange-focused';
            case errored:
              return 'border-red-400';
            default:
              return 'border-gray-400';
          }
        })(),
        disabled && 'opacity-75 pointer-events-none',
        overrideClassNames ?? 'h-6 w-6 rounded'
      ),
    [localChecked, localFocused, disabled, overrideClassNames, errored]
  );

  return (
    <div className={classNameMemo} {...setTestID(testID)}>
      <input
        {...rest}
        disabled={disabled}
        ref={ref}
        type="checkbox"
        className={clsx('sr-only', className)}
        checked={localChecked}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <OkIcon className={clsx('h-4/6 w-4/6 stroke-current pointer-events-none', localChecked ? 'block' : 'hidden')} />
    </div>
  );
});

export default Checkbox;

export const useCheckboxHooks = ({ checked, onChange, onFocus, onBlur, testID, testIDProperties }: CheckboxProps) => {
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

  return { localChecked, localFocused, handleChange, handleFocus, handleBlur };
};
