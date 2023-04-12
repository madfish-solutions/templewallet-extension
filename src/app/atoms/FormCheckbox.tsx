import React, { forwardRef, ReactNode, useCallback } from 'react';

import classNames from 'clsx';

import Checkbox, { CheckboxProps } from 'app/atoms/Checkbox';
import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';

export type FormCheckboxProps = CheckboxProps & {
  label?: ReactNode;
  labelDescription?: ReactNode;
  errorCaption?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
};

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      label,
      labelDescription,
      errorCaption,
      containerClassName,
      labelClassName,
      onChange,
      testID,
      testIDProperties,
      ...rest
    },
    ref
  ) => {
    const { trackEvent } = useAnalytics();

    const handleChange = useCallback(
      (toChecked: boolean, event?: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(toChecked, event);

        testID && trackEvent(testID, AnalyticsEventCategory.CheckboxChange, { toChecked, ...testIDProperties });
      },
      [onChange, trackEvent, testID, testIDProperties]
    );

    return (
      <div className={classNames('flex flex-col', containerClassName)}>
        <label
          className={classNames(
            'flex items-center mb-2 p-4',
            'bg-gray-100 border-2 border-gray-300',
            'rounded-md overflow-hidden cursor-pointer',
            labelClassName
          )}
          {...setTestID(testID)}
        >
          <Checkbox ref={ref} errored={Boolean(errorCaption)} onChange={handleChange} {...rest} />

          {label && (
            <div className="ml-4 leading-tight flex flex-col">
              <span className="text-sm font-semibold text-gray-700">{label}</span>

              {labelDescription && <span className="mt-1 text-xs font-light text-gray-600">{labelDescription}</span>}
            </div>
          )}
        </label>

        {errorCaption && <div className="text-xs text-red-500">{errorCaption}</div>}
      </div>
    );
  }
);
