import { Ref, memo, ReactNode, useCallback, ChangeEvent } from 'react';

import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';

import { Checkbox, CheckboxProps } from './Checkbox';
import { Tooltip } from './Tooltip';

interface SettingsCheckboxProps extends CheckboxProps {
  label: ReactNode;
  tooltip?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export const SettingsCheckbox = memo<SettingsCheckboxProps>(
  ({ label, tooltip, testID, testIDProperties, onChange, ref, ...restProps }) => {
    const { trackEvent } = useAnalytics();

    const handleChange = useCallback(
      (toChecked: boolean, event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(toChecked, event);

        testID && trackEvent(testID, AnalyticsEventCategory.CheckboxChange, { toChecked, ...testIDProperties });
      },
      [onChange, trackEvent, testID, testIDProperties]
    );

    return (
      <div className="flex items-center p-3 rounded-lg bg-white border-lines gap-2 border-0.5 hover:bg-grey-4">
        <label className="flex-1 flex items-center gap-2" {...setTestID(testID)}>
          <Checkbox onChange={handleChange} ref={ref} {...restProps} />
          <span className="text-font-medium-bold">{label}</span>
        </label>
        {tooltip && <Tooltip content={tooltip} size={16} className="text-grey-3" />}
      </div>
    );
  }
);
