import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { ActivityNotificationsInterface, StatusType } from 'lib/teztok-api/interfaces';

import { PropsWithChildren } from '../../../../../lib/props-with-children';
import { ActivityIcon } from '../../components/ActivityIcon';
import { formatDate } from '../../utils/formatDate';
import { truncateDescription, truncateTitle } from '../../utils/truncate';

interface BaseActivityProps extends ActivityNotificationsInterface, PropsWithChildren {
  index: number;
}

export const BaseActivity: FC<BaseActivityProps> = ({
  index,
  id,
  title,
  description,
  createdAt,
  status,
  type,
  children
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
    <ActivityIcon isDotVisible={status === StatusType.New} type={type} />
    <div className="mx-2 w-full">
      <div>
        <div
          className={classNames(
            'mb-1 text-sm font-medium',
            status === StatusType.Read ? 'text-gray-700' : 'text-black'
          )}
        >
          {truncateTitle(title)} {id}
        </div>
        {description && (
          <div className="text-gray-700 text-xs font-normal mb-1">{truncateDescription(description)}</div>
        )}
      </div>

      {children}

      <div className="flex mt-6">
        <div className="text-gray-500 font-medium" style={{ fontSize: 10 }}>
          <span className="uppercase">
            <T id="applied" />
          </span>
          {' ' + formatDate(createdAt)}
        </div>
      </div>
    </div>
  </div>
);
