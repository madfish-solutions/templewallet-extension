import React from 'react';

import { BellIcon, NotificationDotIcon } from 'lib/icons';
import { Link } from 'lib/woozie';

import { HomeSelectors } from '../../../app/pages/Home/Home.selectors';
import { useIsNewNotificationsAvailableSelector } from '../store/selectors';

export const NotificationsBell = () => {
  const isNewNotificationsAvailable = useIsNewNotificationsAvailableSelector();

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
