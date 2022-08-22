import React, { FC } from 'react';

import { T } from 'lib/i18n/react';
import { TempleNotificationsSharedStorageKey, useLocalStorage } from 'lib/temple/front';

import Link from '../../../../lib/woozie/Link';
import { ReactComponent as ArrowRightIcon } from '../../../icons/arrow-right.svg';

interface NewsDetailsButtonProps {
  newsId: string;
}

export const NewsDetailsButton: FC<NewsDetailsButtonProps> = ({ newsId }) => {
  const [, setReadNewsIds] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.ReadNewsIds, []);

  const handleMarkAsRead = () => {
    setReadNewsIds(prev => [...prev.filter(x => x !== newsId), newsId]);
  };

  return (
    <Link to={`/notifications/news/${newsId}`} className="flex row items-center" onClick={handleMarkAsRead}>
      <span className="mr-1 font-medium font-inter text-xs text-primary-orange">
        <T id="details" />
      </span>
      <ArrowRightIcon />
    </Link>
  );
};
