import { useEffect, useRef, useState } from 'react';

import { TEMPLE_BAKERY_PAYOUT_ADDRESS, TEMPLE_REWARDS_PAYOUT_ADDRESS } from 'app/pages/Rewards/constants';
import { getReferralsCount } from 'lib/apis/temple';
import { fetchTokenTransfers } from 'lib/apis/tzkt/api';
import { REWARDS_BADGE_STATE_STORAGE_KEY } from 'lib/constants';
import { APP_VERSION } from 'lib/env';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { TempleTezosChainId } from 'lib/temple/types';
import { useAbortSignal } from 'lib/ui/hooks/useAbortSignal';
import { isAbortError } from 'lib/ui/is-abort-error';
import { useAccountForTezos, useTezosMainnetChain } from 'temple/front';

type BadgeState = {
  initialized: boolean;
  lastChecked: number;
  lastReferralsCount?: number;
  lastSeenVersion?: string;
};

export function useRewardsBadgeVisible() {
  const account = useAccountForTezos();
  const tezosMainnet = useTezosMainnetChain();
  const aborter = useAbortSignal();

  const [state, setState] = useState<BadgeState | null>(null);
  const [visible, setVisible] = useState(false);
  const lastCheckedRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await fetchFromStorage<BadgeState | null>(REWARDS_BADGE_STATE_STORAGE_KEY).catch(() => null);
      const initial: BadgeState = stored ?? {
        initialized: false,
        lastChecked: 0,
        lastReferralsCount: 0,
        lastSeenVersion: undefined
      };
      if (!cancelled) {
        lastCheckedRef.current = initial.lastChecked ?? 0;
        setState(initial);

        const isFirstInstall = !initial.initialized;
        const isUpdate = initial.lastSeenVersion !== APP_VERSION;
        setVisible(isFirstInstall || isUpdate);
      }
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
        const since = lastCheckedRef.current ?? 0;
        const signal = aborter.abortAndRenewSignal();

        const [transfers, referralsCountRaw] = await Promise.all([
          fetchTokenTransfers(
            TempleTezosChainId.Mainnet,
            {
              'timestamp.ge': new Date(since).toISOString(),
              to: account.address,
              'sort.desc': 'id',
              limit: 1
            },
            signal
          ),
          getReferralsCount(signal).catch(err => {
            if (isAbortError(err)) {
              throw err;
            }
            return undefined;
          })
        ]);

        if (cancelled) return;

        const referralsCount = referralsCountRaw ? Number(referralsCountRaw) : state.lastReferralsCount ?? 0;

        const hasNewPayout = transfers.some(
          tr => tr.from.address === TEMPLE_REWARDS_PAYOUT_ADDRESS || tr.from.address === TEMPLE_BAKERY_PAYOUT_ADDRESS
        );
        const hasNewReferral = referralsCount > (state.lastReferralsCount ?? 0);

        const hasUpdateUnseen = (state.lastSeenVersion ?? undefined) !== APP_VERSION;
        const shouldShow = !state.initialized || hasUpdateUnseen || hasNewPayout || hasNewReferral;
        setVisible(shouldShow);

        lastCheckedRef.current = Date.now();
        const nextStored: BadgeState = {
          initialized: state.initialized,
          lastChecked: lastCheckedRef.current,
          lastReferralsCount: referralsCount,
          lastSeenVersion: state.lastSeenVersion ?? APP_VERSION
        };
        await putToStorage(REWARDS_BADGE_STATE_STORAGE_KEY, nextStored);

        if ((state.lastReferralsCount ?? 0) !== referralsCount) {
          if (!cancelled) setState(prev => (prev ? { ...prev, lastReferralsCount: referralsCount } : prev));
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
      aborter.abort();
    };
  }, [aborter, account, state, tezosMainnet.chainId]);

  return visible;
}

export async function acknowledgeRewardsBadge() {
  const stored = await fetchFromStorage<BadgeState | null>(REWARDS_BADGE_STATE_STORAGE_KEY).catch(() => null);
  const nextState: BadgeState = {
    initialized: true,
    lastChecked: Date.now(),
    lastReferralsCount: stored?.lastReferralsCount ?? 0,
    lastSeenVersion: APP_VERSION
  };
  await putToStorage(REWARDS_BADGE_STATE_STORAGE_KEY, nextState);
}
