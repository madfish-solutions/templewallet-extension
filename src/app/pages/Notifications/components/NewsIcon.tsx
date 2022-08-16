import React, { FC, useMemo } from 'react';

import { ReactComponent as AlertNewsIcon } from '../../../icons/alert-news.svg';
import { ReactComponent as ApplicationUpdateNewsIcon } from '../../../icons/application-update-news.svg';
import { ReactComponent as NewspaperIcon } from '../../../icons/newspaper.svg';
import { NewsType } from '../NewsNotifications/NewsNotifications.interface';
import { NotificationsIcon, NotificationsIconProps } from './NotificationsIcon';

interface NewsIconProps extends Pick<NotificationsIconProps, 'isDotVisible'> {
  type: NewsType;
}

export const NewsIcon: FC<NewsIconProps> = ({ isDotVisible, type }) => {
  const icon = useMemo(() => {
    switch (type) {
      case NewsType.Alert:
        return <AlertNewsIcon />;
      case NewsType.ApplicationUpdate:
        return <ApplicationUpdateNewsIcon />;
      default:
        return <NewspaperIcon />;
    }
  }, [type]);

  return <NotificationsIcon isDotVisible={isDotVisible}>{icon}</NotificationsIcon>;
};
