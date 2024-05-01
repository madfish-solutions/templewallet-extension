import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ReactComponent as BellIcon } from 'app/icons/bell.svg';
import { HomeSelectors } from 'app/pages/Home/Home.selectors';
import { BellIcon as OldBellIcon, NotificationDotIcon } from 'lib/icons';
import { Link } from 'lib/woozie';

import { useNewNotificationsAmountSelector } from '../store/selectors';

export const OldNotificationsBell = () => {
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const isNewNotificationsAvailable = newNotificationsAmount > 0;

  return (
    <Link
      to="/notifications"
      className="flex items-center justify-center mr-3"
      style={{
        position: 'relative',
        height: 28,
        width: 28,
        borderRadius: 4,
        backgroundColor: '#E5F2FF'
      }}
      testID={HomeSelectors.notificationIconButton}
      testIDProperties={{ newNotificationsAmount }}
    >
      {isNewNotificationsAvailable && (
        <NotificationDotIcon
          height={5.5}
          width={5.5}
          stroke="#E5F2FF"
          style={{
            position: 'absolute',
            zIndex: 1,
            top: 5,
            right: 8
          }}
        />
      )}

      <OldBellIcon height={16} width={16} stroke="#007AFF" />
    </Link>
  );
};

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
