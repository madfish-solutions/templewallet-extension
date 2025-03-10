import React, { FC } from 'react';

import { setTestID, TestIDProps } from 'lib/analytics';

import { NotificationInterface } from '../../types';

type Props = TestIDProps & Pick<NotificationInterface, 'content'>;

export const NotificationsItemContent: FC<Props> = ({ content, testID }) => (
  <p className="text-font-medium whitespace-pre-wrap" {...setTestID(testID)}>
    {content.map((contentItem, index) => {
      if (typeof contentItem === 'string') {
        return contentItem;
      }

      return (
        <a
          key={contentItem.url + index}
          href={contentItem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary"
        >
          {contentItem.text}
        </a>
      );
    })}
  </p>
);
