import React, { FC } from 'react';

import { useNews } from 'lib/temple/front/news.provider';

import Link from '../../../../lib/woozie/Link';
import { ReactComponent as BellIcon } from '../../../icons/bell.svg';
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
