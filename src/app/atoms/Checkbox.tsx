import React, { forwardRef, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import { TestIDProps, setTestID, useAnalytics, AnalyticsEventCategory } from 'lib/analytics';
import { blurHandler, checkedHandler, focusHandler } from 'lib/ui/inputHandlers';

export type CheckboxProps = TestIDProps &
  Pick<InputHTMLAttributes<HTMLInputElement>, 'name' | 'checked' | 'onFocus' | 'onBlur' | 'onClick'> & {
    containerClassName?: string;
    errored?: boolean;
    onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  };

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { containerClassName, errored = false, checked, onChange, onFocus, onBlur, testID, testIDProperties, ...rest },
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
          'relative flex justify-center items-center h-6 w-6 flex-shrink-0',
          'text-white border rounded-md overflow-hidden',
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
          containerClassName
        ),
      [localChecked, localFocused, errored, containerClassName]
    );

    return (
      <div className={classNameMemo}>
        <input
          ref={ref}
          type="checkbox"
          className="absolute top-0 left-0 invisible w-full h-full"
          checked={localChecked}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...setTestID(testID)}
          {...rest}
        />

        <OkIcon
          className={classNames(localChecked ? 'block' : 'hidden', 'h-4 w-4 pointer-events-none stroke-current')}
          style={{ strokeWidth: 4 }}
        />
      </div>
    );
  }
);

export default Checkbox;
