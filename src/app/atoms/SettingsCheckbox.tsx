import React, { memo, ReactNode, useCallback, useEffect, useMemo } from 'react';

import { createRoot } from 'react-dom/client';

import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';
import useTippy from 'lib/ui/useTippy';

import { CheckboxV2, CheckboxV2Props } from './CheckboxV2';
import { IconBase } from './IconBase';

interface SettingsCheckboxProps extends CheckboxV2Props {
  label: ReactNode;
  tooltip?: ReactNode;
}

export const SettingsCheckbox = memo<SettingsCheckboxProps>(
  ({ label, tooltip, testID, testIDProperties, onChange, ...restProps }) => {
    const { trackEvent } = useAnalytics();

    const tippyProps = useMemo(() => {
      let content: HTMLDivElement | undefined;

      if (tooltip) {
        content = document.createElement('div');
        content.className = 'max-w-48';
      }

      return {
        trigger: 'mouseenter',
        hideOnClick: false,
        interactive: true,
        content,
        placement: 'bottom-end' as const,
        animation: 'shift-away-subtle'
      };
    }, [tooltip]);

    useEffect(() => {
      if (tippyProps.content && tooltip) {
        const root = createRoot(tippyProps.content);
        root.render(tooltip);
      }
    }, [tippyProps.content, tooltip]);

    const infoIconWrapperRef = useTippy<HTMLDivElement>(tippyProps);

    const handleChange = useCallback(
      (toChecked: boolean, event: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(toChecked, event);

        testID && trackEvent(testID, AnalyticsEventCategory.CheckboxChange, { toChecked, ...testIDProperties });
      },
      [onChange, trackEvent, testID, testIDProperties]
    );

    return (
      <div className="flex items-center p-3 rounded-lg bg-white shadow-bottom gap-2 border-0.5 border-transparent hover:border-lines">
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
