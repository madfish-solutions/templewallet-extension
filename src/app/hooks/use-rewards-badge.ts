import { useEffect, useState } from 'react';

import { TEMPLE_BAKERY_PAYOUT_ADDRESS, TEMPLE_REWARDS_PAYOUT_ADDRESS } from 'app/pages/Rewards/constants';
import { getReferralsCount } from 'lib/apis/temple';
import { fetchTokenTransfers, TzktApiChainId } from 'lib/apis/tzkt/api';
import { REWARDS_BADGE_STATE_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { useAccountForTezos, useTezosMainnetChain } from 'temple/front';

type BadgeState = {
  initialized: boolean;
  lastChecked: number;
  lastReferralsCount?: number;
};

export function useRewardsBadgeVisible() {
  const account = useAccountForTezos();
  const tezosMainnet = useTezosMainnetChain();

  const [state, setState] = useState<BadgeState | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await fetchFromStorage<BadgeState | null>(REWARDS_BADGE_STATE_STORAGE_KEY).catch(() => null);
      const initial: BadgeState = stored ?? {
        initialized: false,
        lastChecked: 0,
        lastReferralsCount: 0
      };
      if (!cancelled) setState(initial);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!account || !state) return;

    let cancelled = false;

    (async () => {
      try {
        const since = state.lastChecked ?? 0;

        const [transfers, referralsCountRaw] = await Promise.all([
          fetchTokenTransfers(tezosMainnet.chainId as TzktApiChainId, {
            'timestamp.ge': new Date(since).toISOString(),
            to: account.address,
            'sort.desc': 'id',
            limit: 1
          }),
          getReferralsCount().catch(() => undefined)
        ]);

        if (cancelled) return;

        const referralsCount = referralsCountRaw ? Number(referralsCountRaw) : state.lastReferralsCount ?? 0;

        const hasNewPayout = transfers.some(
          tr => tr.from.address === TEMPLE_REWARDS_PAYOUT_ADDRESS || tr.from.address === TEMPLE_BAKERY_PAYOUT_ADDRESS
        );
        const hasNewReferral = referralsCount > (state.lastReferralsCount ?? 0);

        const shouldShow = !state.initialized || hasNewPayout || hasNewReferral;
        setVisible(shouldShow);

        const nextState: BadgeState = {
          initialized: state.initialized,
          lastChecked: Date.now(),
          lastReferralsCount: referralsCount
        };

        if (JSON.stringify(state) !== JSON.stringify(nextState)) {
          await putToStorage(REWARDS_BADGE_STATE_STORAGE_KEY, nextState);
          if (!cancelled) setState(nextState);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [account, state, tezosMainnet.chainId]);

  return visible;
}

export async function acknowledgeRewardsBadge() {
  const stored = await fetchFromStorage<BadgeState | null>(REWARDS_BADGE_STATE_STORAGE_KEY).catch(() => null);
  const nextState: BadgeState = {
    initialized: true,
    lastChecked: Date.now(),
    lastReferralsCount: stored?.lastReferralsCount ?? 0
  };
  await putToStorage(REWARDS_BADGE_STATE_STORAGE_KEY, nextState);
}
