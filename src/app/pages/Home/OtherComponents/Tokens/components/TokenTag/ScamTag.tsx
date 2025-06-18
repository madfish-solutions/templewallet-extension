import React, { memo } from 'react';

import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { t } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

const scamInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('scamTokenTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'auto' as const
};

export const ScamTag = memo(({ className }: { className?: string }) => {
  const scamInfoIconRef = useTippy<HTMLSpanElement>(scamInfoTippyProps);

  return (
    <span ref={scamInfoIconRef} className={className}>
      <span className="absolute -z-1 inset-0 flex items-center justify-center">
        <span className="w-2 h-2 bg-white rounded-full z-0" />
      </span>

      <ErrorIcon className="w-5 h-5" />
    </span>
  );
});
