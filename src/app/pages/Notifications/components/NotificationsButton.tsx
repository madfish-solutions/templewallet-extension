import React, { FC } from 'react';

import Link from '../../../../lib/woozie/Link';
import { ReactComponent as BellIcon } from '../../../icons/bell.svg';
import { useNews } from '../providers/news.provider';
import { NotificationsIcon } from './NotificationsIcon';

export const NotificationsButton: FC = () => {
  const { isUnreadNews } = useNews();

  return (
    <Link to={'/notifications'} className="bg-blue-100 mr-4" style={{ padding: 6, borderRadius: 7 }}>
      <NotificationsIcon isDotVisible={isUnreadNews} small>
        <BellIcon />
      </NotificationsIcon>
    </Link>
  );
};
