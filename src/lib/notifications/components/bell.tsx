import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ReactComponent as BellIcon } from 'app/icons/bell.svg';

import { useNewNotificationsAmountSelector } from '../store/selectors';

export const NotificationsBell = memo(() => {
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const isNewNotificationsAvailable = newNotificationsAmount > 0;

  return (
    <div className="relative">
      {isNewNotificationsAvailable && <div className="absolute top-1 left-0.5 w-1 h-1 rounded-circle bg-primary" />}

      <IconBase Icon={BellIcon} size={16} className="text-secondary" />
    </div>
  );
});

export const NitificationsDot = memo(() => (
  <div className="absolute top-1 left-0.5 w-1 h-1 rounded-circle bg-primary" />
));
