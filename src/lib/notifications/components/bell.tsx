import React from 'react';

import { HomeSelectors } from 'app/pages/Home/Home.selectors';
import { BellIcon, NotificationDotIcon } from 'lib/icons';
import { Link } from 'lib/woozie';

import { useNewNotificationsAmountSelector } from '../store/selectors';

export const NotificationsBell = () => {
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const isNewNotificationsAvailable = newNotificationsAmount > 0;

  return (
    <Link
      to="/notifications"
      className="flex items-center justify-center"
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

      <BellIcon height={16} width={16} stroke="#007AFF" />
    </Link>
  );
};
