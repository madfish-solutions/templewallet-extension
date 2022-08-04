import React, { FC } from 'react';

import { T } from 'lib/i18n/react';

import { CollectibleSoldActivityNotificationInterface } from '../ActivityNotifications.interface';
import { BaseActivity } from '../BaseActivity';

interface CollectibleSoldActivityProps extends CollectibleSoldActivityNotificationInterface {
  index: number;
}

export const CollectibleSoldActivity: FC<CollectibleSoldActivityProps> = props => {
  return (
    <BaseActivity {...props}>
      <div className="flex row items-center mt-4">
        <span className="font-inter text-gray-600 text-xs font-normal">
          <T id="transaction" />
        </span>
      </div>
    </BaseActivity>
  );
};
