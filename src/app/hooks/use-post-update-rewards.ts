import { useEffect, useState } from 'react';

import {
  getPostUpdateRewardsDaysRemaining,
  isPostUpdateRewardsMultiplierActive,
  POST_UPDATE_REWARDS_PROMO_STATE_STORAGE_KEY,
  PostUpdateRewardsPromoState
} from 'lib/post-update-rewards';
import { useStorage } from 'lib/temple/front';

export const usePostUpdateRewards = () => {
  const [promoState, setPromoState] = useStorage<PostUpdateRewardsPromoState | null>(
    POST_UPDATE_REWARDS_PROMO_STATE_STORAGE_KEY,
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
    multiplierActive: isPostUpdateRewardsMultiplierActive(promoState, now),
    daysRemaining: getPostUpdateRewardsDaysRemaining(now)
  };
};
