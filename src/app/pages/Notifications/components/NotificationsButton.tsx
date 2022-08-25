import React, { FC } from 'react';

import Link from '../../../../lib/woozie/Link';
import { ReactComponent as BellIcon } from '../../../icons/bell.svg';
import { useEvents } from '../providers/events.provider';
import { useNews } from '../providers/news.provider';
import { useReadEvents } from '../use-read-events.hook';
import { NotificationsIcon } from './NotificationsIcon';

export const NotificationsButton: FC = () => {
  const { isUnreadNews } = useNews();
  const { events } = useEvents();
  const { readEventsIds } = useReadEvents();

  const unreadEvents = readEventsIds.length < events.length;

  return (
    <Link to={'/notifications'} className="bg-blue-100 mr-4" style={{ padding: 6, borderRadius: 7 }}>
      <NotificationsIcon isDotVisible={isUnreadNews || unreadEvents} small>
        <BellIcon />
      </NotificationsIcon>
    </Link>
  );
};
