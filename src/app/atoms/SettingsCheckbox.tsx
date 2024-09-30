import React, { forwardRef, memo, ReactNode, useCallback } from 'react';

import clsx from 'clsx';

import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';

import { CheckboxV2, CheckboxV2Props } from './CheckboxV2';
import { Tooltip } from './Tooltip';

interface SettingsCheckboxProps extends CheckboxV2Props {
  label: ReactNode;
  tooltip?: ReactNode;
}

export const SettingsCheckbox = memo(
  forwardRef<HTMLInputElement, SettingsCheckboxProps>(
    ({ label, tooltip, testID, testIDProperties, onChange, ...restProps }, ref) => {
      const { trackEvent } = useAnalytics();

      const handleChange = useCallback(
        (toChecked: boolean, event: React.ChangeEvent<HTMLInputElement>) => {
          onChange?.(toChecked, event);

          testID && trackEvent(testID, AnalyticsEventCategory.CheckboxChange, { toChecked, ...testIDProperties });
        },
        [onChange, trackEvent, testID, testIDProperties]
      );

      return (
        <div
          className={clsx(
            'flex items-center p-3 rounded-lg bg-white shadow-bottom',
            'gap-2 border-0.5 border-transparent hover:border-lines'
          )}
        >
          <label className="flex-1 flex items-center gap-2" {...setTestID(testID)}>
            <CheckboxV2 onChange={handleChange} ref={ref} {...restProps} />
            <span className="text-font-medium-bold">{label}</span>
          </label>
          {tooltip && <Tooltip content={tooltip} size={16} className="text-grey-3" />}
        </div>
      );
    }
  )
);
