import React, { FC } from 'react';

import { useIsEveryNewsReadedSelector } from 'app/store/news/news-selector';

import { Link } from '../../../../lib/woozie/Link';
import { ReactComponent as BellIcon } from '../../../icons/bell.svg';
import { NotificationsIcon } from './NotificationsIcon';

export const NotificationsButton: FC = () => {
  const isDotVisible = useIsEveryNewsReadedSelector();

  return (
    <Link to={'/notifications'} className="bg-blue-100 mr-4" style={{ padding: 6, borderRadius: 7 }}>
      <NotificationsIcon isDotVisible={isDotVisible} small>
        <BellIcon />
      </NotificationsIcon>
    </Link>
  );
};
