import React, { FC } from 'react';

import classNames from 'clsx';

import { NewsNotificationInterface, StatusType } from 'app/store/news/news-interfaces';

import { NewsDetailsButton } from '../components/NewsDetailsButton';
import { NewsIcon } from '../components/NewsIcon';
import { formatDate } from '../utils/formatDate';
import { truncateDescription, truncateTitle } from '../utils/truncate';

interface Props extends NewsNotificationInterface {
  style: React.HTMLAttributes<HTMLDivElement>;
}

export const NewsNotificationsItem: FC<Props> = ({ id, title, description, createdAt, status, type, style }) => (
  <div
    className={classNames(
      'flex column font-inter',
      'p-4',
      status === StatusType.Read && 'bg-gray-200',
      'border-gray-300'
    )}
    style={{
      borderBottomWidth: 1,
      ...style
      // maxHeight: 120,
      // overflow: 'hidden'
    }}
  >
    <NewsIcon isDotVisible={status === StatusType.New} type={type} />
    <div style={{ marginLeft: 10 }} className="w-full flex justify-between flex-col">
      <div>
        <div
          className={classNames(
            'mb-2 text-sm font-medium',
            status === StatusType.Read ? 'text-gray-600' : 'text-black'
          )}
        >
          {truncateTitle(title)}
        </div>
        {truncateDescription(description)
          .split('\n')
          .map((x, index) => (
            <div key={index} className="text-gray-600 text-xs font-normal leading-4">
              {x}
            </div>
          ))}
      </div>
      <div className="flex row justify-between items-center" style={{ height: 24 }}>
        <div className="text-gray-500 font-normal" style={{ fontSize: 10 }}>
          {formatDate(createdAt)}
        </div>
        <NewsDetailsButton newsId={id} />
      </div>
    </div>
  </div>
);
