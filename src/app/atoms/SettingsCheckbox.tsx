import React, { memo, ReactNode, useCallback } from 'react';

import clsx from 'clsx';

import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';

import { CheckboxV2, CheckboxV2Props } from './CheckboxV2';
import { IconBase } from './IconBase';

interface SettingsCheckboxProps extends CheckboxV2Props {
  label: ReactNode;
  tooltip?: ReactNode;
}

const basicTooltipProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  interactive: true,
  placement: 'bottom-end' as const,
  animation: 'shift-away-subtle'
};

const tooltipWrapperFactory = () => {
  const element = document.createElement('div');
  element.className = 'max-w-52';

  return element;
};

export const SettingsCheckbox = memo<SettingsCheckboxProps>(
  ({ label, tooltip, testID, testIDProperties, onChange, ...restProps }) => {
    const { trackEvent } = useAnalytics();

    const infoIconWrapperRef = useRichFormatTooltip<HTMLDivElement>(basicTooltipProps, tooltipWrapperFactory, tooltip);

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
          <CheckboxV2 onChange={handleChange} {...restProps} />
          <span className="text-font-medium-bold">{label}</span>
        </label>
        {tooltip && (
          <div ref={infoIconWrapperRef}>
            <IconBase Icon={InfoFillIcon} size={16} className="text-grey-3" />
          </div>
        )}
      </div>
    );
  }
);
