import React, { FC } from 'react';

import { useDispatch } from 'react-redux';

import { readNewsAction } from 'app/store/news/news-actions';
import { T } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

import { ReactComponent as ArrowRightIcon } from '../../../icons/arrow-right.svg';

interface NewsDetailsButtonProps {
  newsId: string;
}

export const NewsDetailsButton: FC<NewsDetailsButtonProps> = ({ newsId }) => {
  const dispatch = useDispatch();

  const handleMarkAsRead = () => {
    dispatch(readNewsAction(newsId));
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
