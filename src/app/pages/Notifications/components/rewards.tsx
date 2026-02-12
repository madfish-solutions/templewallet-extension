import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { AnimatedDot } from 'app/atoms/AnimatedDot';
import { useRewardsBadgeVisible } from 'app/hooks/use-rewards-badge';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';

export const RewardsIconWithBadge = memo(({ className }: { className?: string }) => {
  const rewardsBadgeVisible = useRewardsBadgeVisible();

  return (
    <div className="relative">
      {rewardsBadgeVisible && <AnimatedDot className="top-1 left-0.5" />}

      <IconBase Icon={GiftIcon} size={16} className={className ?? 'text-secondary'} />
    </div>
  );
});
