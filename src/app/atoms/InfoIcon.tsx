import React, { memo, useMemo } from 'react';

import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { t, TID } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

import { IconBase, Size } from './IconBase';

interface Props {
  infoContent: TID;
  iconSize?: Size;
}

export const InfoIcon = memo<Props>(({ infoContent, iconSize = 12 }) => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: t(infoContent),
      animation: 'shift-away-subtle',
      placement: 'top' as const
    }),
    []
  );

  const iconRef = useTippy<HTMLDivElement>(tippyProps);

  return <IconBase ref={iconRef} Icon={InfoFillIcon} size={iconSize} className="text-grey-2" />;
});
