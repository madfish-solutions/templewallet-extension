import { useCallback, useMemo } from 'react';

import retry from 'async-retry';
import BigNumber from 'bignumber.js';
import useSWR, { unstable_serialize, useSWRConfig } from 'swr';

import { BoundaryError } from 'app/ErrorBoundary';
import {
  BakingBadBaker,
  BakingBadBakerValueHistoryItem,
  bakingBadGetBaker,
  getAllBakersBakingBad
} from 'lib/apis/baking-bad';
import { getAccountStatsFromTzkt, isKnownChainId, TzktRewardsEntry, TzktAccountType } from 'lib/apis/tzkt';
import { t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import type { ReactiveTezosToolkit } from 'lib/temple/front';
import { getOnlineStatus } from 'lib/ui/get-online-status';

import { useChainId, useNetwork, useTezos } from './ready';

function getDelegateCacheKey(
  tezos: ReactiveTezosToolkit,
  address: string,
  chainId: string | nullish,
  shouldPreventErrorPropagation: boolean
) {
  return unstable_serialize(['delegate', tezos.checksum, address, chainId, shouldPreventErrorPropagation]);
}

export function useDelegate(address: string, suspense = true, shouldPreventErrorPropagation = true) {
  const tezos = useTezos();
  const chainId = useChainId(suspense);
  const { cache: swrCache } = useSWRConfig();

  const resetDelegateCache = useCallback(() => {
    swrCache.delete(getDelegateCacheKey(tezos, address, chainId, shouldPreventErrorPropagation));
  }, [address, tezos, chainId, swrCache, shouldPreventErrorPropagation]);

  const getDelegate = useCallback(async () => {
    try {
      return await retry(
        async () => {
          const freshChainId = chainId ?? (await tezos.rpc.getChainId());
          if (freshChainId && isKnownChainId(freshChainId)) {
            try {
              const accountStats = await getAccountStatsFromTzkt(address, freshChainId);

              switch (accountStats.type) {
                case TzktAccountType.Empty:
                  return null;
                case TzktAccountType.User:
                case TzktAccountType.Contract:
                  return accountStats.delegate?.address ?? null;
              }
            } catch (e) {
              console.error(e);
            }
          }

          return await tezos.rpc.getDelegate(address);
        },
        { retries: 3, minTimeout: 3000, maxTimeout: 5000 }
      );
    } catch (e) {
      if (shouldPreventErrorPropagation) {
        return null;
      }

      throw new BoundaryError(
        getOnlineStatus() ? t('errorGettingBakerAddressMessageOnline') : t('errorGettingBakerAddressMessage'),
        resetDelegateCache
      );
    }
  }, [chainId, tezos, address, shouldPreventErrorPropagation, resetDelegateCache]);

  return useSWR(['delegate', tezos.checksum, address, chainId, shouldPreventErrorPropagation], getDelegate, {
    dedupingInterval: 20_000,
    suspense
  });
}

type RewardConfig = Record<
  | 'blocks'
  | 'endorses'
  | 'fees'
  | 'accusationRewards'
  | 'accusationLostDeposits'
  | 'accusationLostRewards'
  | 'accusationLostFees'
  | 'revelationRewards'
  | 'revelationLostRewards'
  | 'revelationLostFees'
  | 'missedBlocks'
  | 'stolenBlocks'
  | 'missedEndorses'
  | 'lowPriorityEndorses',
  boolean
>;
export type Baker = Pick<
  BakingBadBaker,
  'address' | 'name' | 'fee' | 'freeSpace' | 'minDelegation' | 'stakingBalance'
> & {
  logo?: string;
  feeHistory?: BakingBadBakerValueHistoryItem<number>[];
  rewardConfigHistory: BakingBadBakerValueHistoryItem<RewardConfig>[];
};

const defaultRewardConfigHistory = [
  {
    cycle: 0,
    value: {
      blocks: true,
      endorses: true,
      fees: true,
      accusationRewards: true,
      accusationLostDeposits: true,
      accusationLostRewards: true,
      accusationLostFees: true,
      revelationRewards: true,
      revelationLostRewards: true,
      revelationLostFees: true,
      missedBlocks: true,
      stolenBlocks: true,
      missedEndorses: true,
      lowPriorityEndorses: true
    }
  }
];

export function useKnownBaker(address: string | null, suspense = true) {
  const net = useNetwork();
  const fetchBaker = useCallback(async (): Promise<Baker | null> => {
    if (!address) return null;
    try {
      const bakingBadBaker = await bakingBadGetBaker({ address, configs: true });

      if (typeof bakingBadBaker === 'object') {
        return {
          address: bakingBadBaker.address,
          name: bakingBadBaker.name,
          logo: bakingBadBaker.logo ? bakingBadBaker.logo : undefined,
          fee: bakingBadBaker.fee,
          freeSpace: bakingBadBaker.freeSpace,
          stakingBalance: bakingBadBaker.stakingBalance,
          feeHistory: bakingBadBaker.config?.fee,
          minDelegation: bakingBadBaker.minDelegation,
          rewardConfigHistory:
            bakingBadBaker.config?.rewardStruct.map(({ cycle, value: rewardStruct }) => ({
              cycle,
              value: {
                blocks: (rewardStruct & 1) > 0,
                endorses: (rewardStruct & 2) > 0,
                fees: (rewardStruct & 4) > 0,
                accusationRewards: (rewardStruct & 8) > 0,
                accusationLostDeposits: (rewardStruct & 16) > 0,
                accusationLostRewards: (rewardStruct & 32) > 0,
                accusationLostFees: (rewardStruct & 64) > 0,
                revelationRewards: (rewardStruct & 128) > 0,
                revelationLostRewards: (rewardStruct & 256) > 0,
                revelationLostFees: (rewardStruct & 512) > 0,
                missedBlocks: (rewardStruct & 1024) > 0,
                stolenBlocks: (rewardStruct & 2048) > 0,
                missedEndorses: (rewardStruct & 4096) > 0,
                lowPriorityEndorses: (rewardStruct & 8192) > 0
              }
            })) ?? defaultRewardConfigHistory
        };
      }

      return null;
    } catch (_err) {
      return null;
    }
  }, [address]);
  return useRetryableSWR(net.type === 'main' && address ? ['baker', address] : null, fetchBaker, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    suspense
  });
}

export function useKnownBakers(suspense = true) {
  const net = useNetwork();
  const { data: bakers } = useRetryableSWR(net.type === 'main' ? 'all-bakers' : null, getAllBakersBakingBad, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    suspense
  });

  return useMemo(() => (bakers && bakers.length > 1 ? bakers : null), [bakers]);
}

type RewardsStatsCalculationParams = {
  rewardsEntry: TzktRewardsEntry;
  bakerDetails: Baker | null | undefined;
  currentCycle: number | undefined;
} & Record<
  | 'fallbackRewardPerOwnBlock'
  | 'fallbackRewardPerEndorsement'
  | 'fallbackRewardPerFutureBlock'
  | 'fallbackRewardPerFutureEndorsement',
  BigNumber
>;

function getBakingEfficiency({ rewardsEntry, bakerDetails }: RewardsStatsCalculationParams) {
  const {
    cycle,
    ownBlockRewards,
    extraBlockRewards,
    futureBlockRewards,
    endorsementRewards,
    futureEndorsementRewards,
    ownBlocks,
    futureBlocks,
    futureEndorsements,
    endorsements,
    ownBlockFees,
    extraBlockFees,
    revelationRewards,
    doubleBakingRewards,
    doubleEndorsingRewards,
    missedEndorsementRewards,
    missedExtraBlockRewards,
    missedExtraBlockFees,
    missedOwnBlockFees,
    missedOwnBlockRewards
  } = rewardsEntry;
  let rewardConfig = defaultRewardConfigHistory[0].value;
  if (bakerDetails?.rewardConfigHistory) {
    const { rewardConfigHistory } = bakerDetails;
    for (const historyEntry of rewardConfigHistory) {
      if (cycle >= historyEntry.cycle) {
        rewardConfig = historyEntry.value;
        break;
      }
    }
  }
  const totalFutureRewards = new BigNumber(rewardConfig.endorses ? futureEndorsementRewards : 0).plus(
    rewardConfig.blocks ? futureBlockRewards : 0
  );
  const totalCurrentRewards = new BigNumber(
    rewardConfig.blocks ? new BigNumber(extraBlockRewards).plus(ownBlockRewards) : 0
  )
    .plus(rewardConfig.endorses ? new BigNumber(endorsementRewards).plus(doubleEndorsingRewards) : 0)
    .plus(rewardConfig.fees ? new BigNumber(ownBlockFees).plus(extraBlockFees) : 0)
    .plus(rewardConfig.revelationRewards ? revelationRewards : 0)
    .plus(doubleBakingRewards);
  const totalRewards = totalFutureRewards.plus(totalCurrentRewards);

  const fullEfficiencyIncome = new BigNumber(4e7)
    .multipliedBy(new BigNumber(ownBlocks).plus(futureBlocks))
    .plus(new BigNumber(1.25e6).multipliedBy(new BigNumber(endorsements).plus(futureEndorsements)));
  const totalLost = new BigNumber(missedEndorsementRewards)
    .plus(missedExtraBlockFees)
    .plus(missedExtraBlockRewards)
    .plus(missedOwnBlockFees)
    .plus(missedOwnBlockRewards);
  const totalGain = totalRewards.minus(totalLost).minus(fullEfficiencyIncome);
  return new BigNumber(1).plus(totalGain.div(fullEfficiencyIncome));
}

type CycleStatus = 'unlocked' | 'locked' | 'future' | 'inProgress';

export function getRewardsStats(params: RewardsStatsCalculationParams) {
  const { rewardsEntry, bakerDetails, currentCycle } = params;
  const {
    cycle,
    balance,
    ownBlockRewards,
    extraBlockRewards,
    futureBlockRewards,
    endorsementRewards,
    futureEndorsementRewards,
    stakingBalance,
    expectedBlocks,
    expectedEndorsements,
    ownBlockFees,
    extraBlockFees,
    revelationRewards,
    doubleBakingRewards,
    doubleEndorsingRewards
  } = rewardsEntry;

  const totalFutureRewards = new BigNumber(futureEndorsementRewards).plus(futureBlockRewards);
  const totalCurrentRewards = new BigNumber(extraBlockRewards)
    .plus(endorsementRewards)
    .plus(ownBlockRewards)
    .plus(ownBlockFees)
    .plus(extraBlockFees)
    .plus(revelationRewards)
    .plus(doubleBakingRewards)
    .plus(doubleEndorsingRewards);
  const cycleStatus: CycleStatus = (() => {
    switch (true) {
      case totalFutureRewards.eq(0) && (currentCycle === undefined || cycle <= currentCycle - 6):
        return 'unlocked';
      case totalFutureRewards.eq(0):
        return 'locked';
      case totalCurrentRewards.eq(0):
        return 'future';
      default:
        return 'inProgress';
    }
  })();
  const totalRewards = totalFutureRewards.plus(totalCurrentRewards);
  const rewards = totalRewards.multipliedBy(balance).div(stakingBalance);
  let luck = expectedBlocks + expectedEndorsements > 0 ? new BigNumber(-1) : new BigNumber(0);
  if (totalFutureRewards.plus(totalCurrentRewards).gt(0)) {
    luck = calculateLuck(params, totalRewards);
  }
  let bakerFeePart = bakerDetails?.fee ?? 0;
  if (bakerDetails?.feeHistory) {
    const { feeHistory } = bakerDetails;
    for (let i = 0; i < feeHistory.length; i++) {
      const historyEntry = feeHistory[i];
      if (cycle >= historyEntry.cycle) {
        bakerFeePart = historyEntry.value;
        break;
      }
    }
  }
  const bakerFee = rewards.multipliedBy(bakerFeePart);
  return {
    balance,
    rewards,
    luck,
    bakerFeePart,
    bakerFee,
    cycleStatus,
    efficiency: getBakingEfficiency(params)
  };
}

const calculateLuck = (params: RewardsStatsCalculationParams, totalRewards: BigNumber) => {
  const {
    rewardsEntry,
    fallbackRewardPerOwnBlock,
    fallbackRewardPerEndorsement,
    fallbackRewardPerFutureBlock,
    fallbackRewardPerFutureEndorsement
  } = params;
  const {
    ownBlockRewards,
    futureBlockRewards,
    endorsementRewards,
    futureEndorsementRewards,
    expectedBlocks,
    expectedEndorsements,
    ownBlocks,
    futureBlocks,
    futureEndorsements,
    endorsements
  } = rewardsEntry;
  const rewardPerOwnBlock = ownBlocks === 0 ? fallbackRewardPerOwnBlock : new BigNumber(ownBlockRewards).div(ownBlocks);
  const rewardPerEndorsement =
    endorsements === 0 ? fallbackRewardPerEndorsement : new BigNumber(endorsementRewards).div(endorsements);
  const asIfNoFutureExpectedBlockRewards = new BigNumber(expectedBlocks).multipliedBy(rewardPerOwnBlock);
  const asIfNoFutureExpectedEndorsementRewards = new BigNumber(expectedEndorsements).multipliedBy(rewardPerEndorsement);
  const asIfNoFutureExpectedRewards = asIfNoFutureExpectedBlockRewards.plus(asIfNoFutureExpectedEndorsementRewards);

  const rewardPerFutureBlock =
    futureBlocks === 0 ? fallbackRewardPerFutureBlock : new BigNumber(futureBlockRewards).div(futureBlocks);
  const rewardPerFutureEndorsement =
    futureEndorsements === 0
      ? fallbackRewardPerFutureEndorsement
      : new BigNumber(futureEndorsementRewards).div(futureEndorsements);
  const asIfNoCurrentExpectedBlockRewards = new BigNumber(expectedBlocks).multipliedBy(rewardPerFutureBlock);
  const asIfNoCurrentExpectedEndorsementRewards = new BigNumber(expectedEndorsements).multipliedBy(
    rewardPerFutureEndorsement
  );
  const asIfNoCurrentExpectedRewards = asIfNoCurrentExpectedBlockRewards.plus(asIfNoCurrentExpectedEndorsementRewards);

  const weights =
    endorsements + futureEndorsements === 0
      ? { current: ownBlocks, future: futureBlocks }
      : { current: endorsements, future: futureEndorsements };
  const totalExpectedRewards =
    weights.current + weights.future === 0
      ? new BigNumber(0)
      : asIfNoFutureExpectedRewards
          .multipliedBy(weights.current)
          .plus(asIfNoCurrentExpectedRewards.multipliedBy(weights.future))
          .div(new BigNumber(weights.current).plus(weights.future));

  return totalRewards.minus(totalExpectedRewards).div(totalExpectedRewards);
};
