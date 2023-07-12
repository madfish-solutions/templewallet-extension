import React, { forwardRef, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import { TestIDProps, setTestID, useAnalytics, AnalyticsEventCategory } from 'lib/analytics';
import { blurHandler, checkedHandler, focusHandler } from 'lib/ui/inputHandlers';

export interface CheckboxProps
  extends TestIDProps,
    Pick<InputHTMLAttributes<HTMLInputElement>, 'name' | 'checked' | 'className' | 'onFocus' | 'onBlur' | 'onClick'> {
  overrideClassNames?: string;
  errored?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      overrideClassNames,
      errored = false,
      className,
      checked,
      onChange,
      onFocus,
      onBlur,
      testID,
      testIDProperties,
      ...rest
    },
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

    const classNameMemo = useMemo(
      () =>
        classNames(
          'flex justify-center items-center flex-shrink-0',
          'text-white border overflow-hidden',
          'transition ease-in-out duration-200 disable-outline-for-click',
          localChecked ? 'bg-primary-orange' : 'bg-black-40',
          localFocused && 'shadow-outline',
          (() => {
            switch (true) {
              case localChecked:
                return 'border-primary-orange-dark';
              case localFocused:
                return 'border-primary-orange';
              case errored:
                return 'border-red-400';
              default:
                return 'border-gray-400';
            }
          })(),
          overrideClassNames || 'h-6 w-6 rounded-md'
        ),
      [localChecked, localFocused, errored]
    );

    return (
      <div className={classNameMemo}>
        <input
          ref={ref}
          type="checkbox"
          className={classNames('sr-only', className)}
          checked={localChecked}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...setTestID(testID)}
          {...rest}
        />

        <OkIcon
          className={classNames(localChecked ? 'block' : 'hidden', 'pointer-events-none stroke-current')}
          style={{ strokeWidth: 2, height: '67%', width: '67%' }}
        />
      </div>
    );
  }
);

export default Checkbox;
