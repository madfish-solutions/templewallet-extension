import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import { useNewNotificationsAmountSelector } from 'app/store/notifications/selectors';

export const RewardsIconWithBadge = memo(() => {
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const isNewNotificationsAvailable = newNotificationsAmount > 0;

  return (
    <div className="relative">
      {isNewNotificationsAvailable && <AnimatedDot />}

      <IconBase Icon={GiftIcon} size={16} className="text-secondary" />
    </div>
  );
});

const AnimatedDot = memo(() => (
  <div className="absolute top-1 left-0.5">
    <span className="relative flex w-1 h-1">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-circle bg-primary-hover opacity-75" />
      <span className="relative inline-flex rounded-circle w-1 h-1 bg-primary" />
    </span>
  </div>
));
