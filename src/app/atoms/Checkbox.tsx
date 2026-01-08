import React, { forwardRef, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { ReactComponent as CheckmarkEmptyIcon } from 'app/icons/base/checkmark_empty.svg';
import { ReactComponent as CheckmarkFilledIcon } from 'app/icons/base/checkmark_fill.svg';
import { TestIDProps, setTestID, useAnalytics, AnalyticsEventCategory } from 'lib/analytics';
import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';
import { checkedHandler } from 'lib/ui/inputHandlers';

import { IconBase } from './IconBase';

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

export const Checkbox = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { overrideClassNames, errored = false, className, testID, disabled, ...rest } = props;

  const { localChecked, localFocused, handleChange, handleFocus, handleBlur } = useCheckboxHooks(props);

  const containerClassName = useMemo(
    () =>
      clsx(
        'flex justify-center items-center shrink-0 transition ease-in-out duration-200 disable-outline-for-click',
        localFocused && 'shadow-outline',
        !disabled && 'cursor-pointer'
      ),
    [localFocused, disabled]
  );

  return (
    <div className={containerClassName} {...setTestID(testID)}>
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

      <IconBase size={16} Icon={localChecked ? CheckmarkFilledIcon : CheckmarkEmptyIcon} className="text-primary" />
    </div>
  );
});

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

  const { isFocused: localFocused, onFocus: handleFocus, onBlur: handleBlur } = useFocusHandlers(onFocus, onBlur);

  return { localChecked, localFocused, handleChange, handleFocus, handleBlur };
};
