import React, { FC } from 'react';

import classNames from 'clsx';

import { NewsNotificationInterface, StatusType } from 'lib/temple/front/news.provider';

import { NewsDetailsButton } from '../components/NewsDetailsButton';
import { NewsIcon } from '../components/NewsIcon';
import { formatDate } from '../utils/formatDate';
import { truncateDescription, truncateTitle } from '../utils/truncate';

interface NewsNotificationsItemProps extends NewsNotificationInterface {
  index: number;
}

export const NewsNotificationsItem: FC<NewsNotificationsItemProps> = ({
  index,
  id,
  title,
  description,
  createdAt,
  status,
  type
}) => (
  <div
    className={classNames(
      'flex column font-inter',
      'pt-4 pb-5 px-2',
      status === StatusType.Read && 'bg-gray-200',
      'border-gray-300'
    )}
    style={{
      borderTopWidth: index === 0 ? 0 : 1,
      borderBottomWidth: 1
    }}
  >
    <NewsIcon isDotVisible={status === StatusType.New} type={type} />
    <div className="mx-2 w-full">
      <div>
        <div
          className={classNames(
            'mb-1 text-sm font-medium',
            status === StatusType.Read ? 'text-gray-600' : 'text-black'
          )}
        >
          {truncateTitle(title)}
        </div>
        <div className="text-gray-600 text-xs font-normal">{truncateDescription(description)}</div>
      </div>
      <div className="flex row justify-between mt-7">
        <div className="text-gray-500 font-normal" style={{ fontSize: 10 }}>
          {formatDate(createdAt)}
        </div>
        <NewsDetailsButton newsId={id} />
      </div>
    </div>
  </div>
);
