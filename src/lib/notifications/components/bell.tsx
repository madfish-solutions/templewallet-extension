import React from 'react';

import { HomeSelectors } from 'app/pages/Home/Home.selectors';
import { BellReadIcon, BellUnreadIcon } from 'lib/icons';
import { Link } from 'lib/woozie';

import { useNewNotificationsAmountSelector } from '../store/selectors';

export const NotificationsBell = () => {
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const BellIcon = newNotificationsAmount > 0 ? BellUnreadIcon : BellReadIcon;

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
      <BellIcon height={16} width={16} className="text-blue-650 stroke-current fill-current" />
    </Link>
  );
};
