import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { AnimatedDot } from 'app/atoms/AnimatedDot';
import { ReactComponent as BellIcon } from 'app/icons/base/bell.svg';
import { useNewNotificationsAmountSelector } from 'app/store/notifications/selectors';

export const NotificationsBell = memo(() => {
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const isNewNotificationsAvailable = newNotificationsAmount > 0;

  return (
    <div className="relative">
      {isNewNotificationsAvailable && <AnimatedDot className="top-1 left-0.5" />}

      <IconBase Icon={BellIcon} size={16} className="text-secondary" />
    </div>
  );
});
