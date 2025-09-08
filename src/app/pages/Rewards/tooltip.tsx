import React, { memo, useMemo } from 'react';

import { ReactComponent as AlertIcon } from 'app/icons/alert.svg';
import { setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';

interface RewardsTooltipProps {
  placement: UseTippyOptions['placement'];
  content: string;
  testID?: string;
  Icon?: ImportedSVGComponent;
}

export const RewardsTooltip = memo<RewardsTooltipProps>(({ placement, content, testID, Icon = AlertIcon }) => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content,
      animation: 'shift-away-subtle',
      placement
    }),
    [content, placement]
  );

  const ref = useTippy<HTMLDivElement>(tippyProps);

  return (
    <div className="w-6 h-6 flex items-center justify-center" ref={ref} {...setTestID(testID)}>
      <Icon className="w-4 h-4 text-gray-600 stroke-current" />
    </div>
  );
});

export const inviteAccountInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('inviteAccountTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '14rem',
  placement: 'top-start' as const
};

export const advancedFeaturesInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('advancedFeaturesTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-end' as const
};
