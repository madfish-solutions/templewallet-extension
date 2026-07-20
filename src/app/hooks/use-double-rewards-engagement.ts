import { useEffect, useState } from 'react';

import { DOUBLE_REWARDS_ENGAGEMENT_PROMO_STATE_STORAGE_KEY } from 'lib/constants';
import {
  DoubleRewardsEngagementPromoState,
  getDoubleRewardsEngagementDaysRemaining,
  isDoubleRewardsEngagementMultiplierActive
} from 'lib/double-rewards-engagement';
import { useStorage } from 'lib/temple/front';

export const useDoubleRewardsEngagement = () => {
  const [promoState, setPromoState] = useStorage<DoubleRewardsEngagementPromoState | null>(
    DOUBLE_REWARDS_ENGAGEMENT_PROMO_STATE_STORAGE_KEY,
    null
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeout = setTimeout(() => setNow(new Date()), nextMidnight.getTime() - now.getTime());
    return () => clearTimeout(timeout);
  }, [now]);

  return {
    promoState,
    setPromoState,
    isParticipant: Boolean(promoState),
    multiplierActive: isDoubleRewardsEngagementMultiplierActive(promoState, now),
    daysRemaining: getDoubleRewardsEngagementDaysRemaining(now)
  };
};
