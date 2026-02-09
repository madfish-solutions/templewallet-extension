import { useCallback, useMemo } from 'react';

import { ChainIds } from '@tezos-x/octez.js';
import retry from 'async-retry';
import useSWR, { unstable_serialize, useSWRConfig } from 'swr';

import { BoundaryError } from 'app/ErrorBoundary';
import { BakingBadBaker, bakingBadGetBaker, getAllBakersBakingBad } from 'lib/apis/baking-bad';
import { getAccountStatsFromTzkt, isKnownChainId, TzktRewardsEntry, TzktAccountType } from 'lib/apis/tzkt';
import { TzktCycle, TzktProtocol, TzktSetDelegateParamsOperation } from 'lib/apis/tzkt/types';
import { t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { getOnlineStatus } from 'lib/ui/get-online-status';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';

import { mutezToTz } from '../helpers';

function getDelegateCacheKey(
  rpcUrl: string,
  address: string,
  chainId: string | nullish,
  shouldPreventErrorPropagation: boolean
) {
  return ['delegate', rpcUrl, address, chainId, shouldPreventErrorPropagation];
}

export function useDelegate(
  address: string,
  network: TezosNetworkEssentials,
  suspense = true,
  shouldPreventErrorPropagation = true
) {
  const { rpcBaseURL, chainId } = network;

  const { cache: swrCache } = useSWRConfig();

  const resetDelegateCache = useCallback(() => {
    swrCache.delete(
      unstable_serialize(getDelegateCacheKey(rpcBaseURL, address, chainId, shouldPreventErrorPropagation))
    );
  }, [address, rpcBaseURL, chainId, swrCache, shouldPreventErrorPropagation]);

  const getDelegate = useCallback(async () => {
    try {
      const tezos = getTezosReadOnlyRpcClient(network);

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
  }, [chainId, rpcBaseURL, address, shouldPreventErrorPropagation, resetDelegateCache]);

  return useSWR(getDelegateCacheKey(rpcBaseURL, address, chainId, shouldPreventErrorPropagation), getDelegate, {
    dedupingInterval: 20_000,
    suspense
  });
}

export type Baker = BakingBadBaker & {
  logo?: string;
};

/** returns cats avatars for unknown baker addresses */
export const getBakerLogoUrl = (bakerAddress: string) => `https://services.tzkt.io/v1/avatars/${bakerAddress}`;

const toBakerWithLogo = (baker: BakingBadBaker) => ({
  ...baker,
  logo: getBakerLogoUrl(baker.address)
});

export function useKnownBaker(address: string | null, chainId: string, suspense = true) {
  const isMainnet = chainId === ChainIds.MAINNET;

  const fetchBaker = useCallback(async (): Promise<Baker | null> => {
    if (!address) return null;
    try {
      const bakingBadBaker = await bakingBadGetBaker({ address });

      return bakingBadBaker ? toBakerWithLogo(bakingBadBaker) : null;
    } catch (_err) {
      return null;
    }
  }, [address]);

  return useRetryableSWR(isMainnet && address ? ['baker', address] : null, fetchBaker, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    suspense
  });
}

export function useKnownBakers(chainId: string, suspense = true) {
  const isMainnet = chainId === ChainIds.MAINNET;

  const { data: bakers } = useRetryableSWR(isMainnet ? 'all-bakers' : null, getAllBakersBakingBad, {
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
    suspense
  });

  return useMemo(() => (bakers && bakers.length > 1 ? bakers.map(baker => toBakerWithLogo(baker)) : null), [bakers]);
}

interface RewardsStatsCalculationParams
  extends Pick<TzktSetDelegateParamsOperation, 'limitOfStakingOverBaking' | 'edgeOfBakingOverStaking'> {
  rewardsEntry: TzktRewardsEntry;
  cycle: TzktCycle;
  protocol: TzktProtocol;
  delegationFee: number;
  minDelegation: number;
}

function sumFields<K extends string, T extends Record<K, number>>(
  item: T,
  positiveSummands: K[],
  negativeSummands: K[]
) {
  return (
    positiveSummands.reduce((sum, key) => sum + item[key], 0) -
    negativeSummands.reduce((sum, key) => sum + item[key], 0)
  );
}

export function getRewardsStats({
  rewardsEntry,
  cycle,
  protocol,
  limitOfStakingOverBaking,
  edgeOfBakingOverStaking,
  delegationFee: delegationFeeRatio,
  minDelegation
}: RewardsStatsCalculationParams) {
  limitOfStakingOverBaking /= 1e6;
  edgeOfBakingOverStaking /= 1e9;
  const { delegatedBalance, stakedBalance, bakerRewards } = rewardsEntry;
  const {
    futureAttestations,
    attestations,
    missedAttestations,
    futureBlocks,
    blocks,
    missedBlocks,
    missedAttestationRewards,
    missedBlockFees,
    missedBlockRewards,
    futureBlockRewards,
    futureAttestationRewards,
    blockRewardsDelegated,
    blockRewardsStakedOwn,
    blockRewardsStakedEdge,
    blockRewardsStakedShared,
    blockFees,
    doubleBakingLostStaked,
    doubleEndorsingLostStaked,
    doublePreendorsingLostStaked,
    attestationRewardsDelegated,
    attestationRewardsStakedOwn,
    attestationRewardsStakedEdge,
    attestationRewardsStakedShared,
    ownStakedBalance,
    ownDelegatedBalance,
    externalStakedBalance,
    bakingPower,
    externalDelegatedBalance,
    doubleBakingLostExternalStaked,
    doubleEndorsingLostExternalStaked,
    doublePreendorsingLostExternalStaked
  } = bakerRewards;

  const {
    blockReward: legacyBlockReward,
    attestationReward: legacyEndorsementReward,
    attestersPerBlock,
    consensusThreshold
  } = protocol.constants;

  let blockReward: number;
  let blockBonusPerSlot: number;
  let attestationRewardPerSlot: number;
  if ('attestationRewardPerSlot' in cycle) {
    blockReward = cycle.blockReward;
    blockBonusPerSlot = cycle.blockBonusPerSlot;
    attestationRewardPerSlot = cycle.attestationRewardPerSlot;
  } else {
    blockReward = legacyBlockReward[0];
    blockBonusPerSlot = legacyBlockReward[1];
    attestationRewardPerSlot = legacyEndorsementReward[0];
  }

  const rewardsPerBlock = blockReward + blockBonusPerSlot * (attestersPerBlock - consensusThreshold);
  const assignedRewards =
    (futureBlocks + blocks + missedBlocks) * rewardsPerBlock +
    (futureAttestations + attestations + missedAttestations) * attestationRewardPerSlot;

  const earnedRewards = sumFields(
    bakerRewards,
    [
      'blockRewardsDelegated',
      'blockRewardsStakedOwn',
      'blockRewardsStakedEdge',
      'blockRewardsStakedShared',
      'attestationRewardsDelegated',
      'attestationRewardsStakedOwn',
      'attestationRewardsStakedEdge',
      'attestationRewardsStakedShared',
      'blockFees'
    ],
    []
  );
  const extraRewards = sumFields(
    bakerRewards,
    [
      'doubleBakingRewards',
      'doubleEndorsingRewards',
      'doublePreendorsingRewards',
      'vdfRevelationRewardsDelegated',
      'vdfRevelationRewardsStakedOwn',
      'vdfRevelationRewardsStakedEdge',
      'vdfRevelationRewardsStakedShared',
      'nonceRevelationRewardsDelegated',
      'nonceRevelationRewardsStakedOwn',
      'nonceRevelationRewardsStakedEdge',
      'nonceRevelationRewardsStakedShared'
    ],
    [
      'doubleBakingLostStaked',
      'doubleBakingLostUnstaked',
      'doubleBakingLostExternalStaked',
      'doubleBakingLostExternalUnstaked',
      'doubleEndorsingLostStaked',
      'doubleEndorsingLostUnstaked',
      'doubleEndorsingLostExternalStaked',
      'doubleEndorsingLostExternalUnstaked',
      'doublePreendorsingLostStaked',
      'doublePreendorsingLostUnstaked',
      'doublePreendorsingLostExternalStaked',
      'doublePreendorsingLostExternalUnstaked',
      'nonceRevelationLosses'
    ]
  );

  const futureRewards = futureBlockRewards + futureAttestationRewards;
  const totalRewards = earnedRewards + extraRewards;

  // TODO: figure out the meaning of variables with obfuscated names here and below
  const k = sumFields(
    bakerRewards,
    [
      'blockRewardsDelegated',
      'attestationRewardsDelegated',
      'vdfRevelationRewardsDelegated',
      'nonceRevelationRewardsDelegated',
      'doubleBakingRewards',
      'doubleEndorsingRewards',
      'doublePreendorsingRewards',
      'blockFees'
    ],
    []
  );
  const y = sumFields(
    bakerRewards,
    [
      'doubleBakingLostUnstaked',
      'doubleBakingLostExternalUnstaked',
      'doubleEndorsingLostUnstaked',
      'doubleEndorsingLostExternalUnstaked',
      'doublePreendorsingLostUnstaked',
      'doublePreendorsingLostExternalUnstaked',
      'nonceRevelationLosses'
    ],
    []
  );
  const stakedEdgeRewards = sumFields(
    bakerRewards,
    [
      'blockRewardsStakedEdge',
      'attestationRewardsStakedEdge',
      'vdfRevelationRewardsStakedEdge',
      'nonceRevelationRewardsStakedEdge'
    ],
    []
  );
  const stakedSharedRewards = sumFields(
    bakerRewards,
    [
      'blockRewardsStakedShared',
      'attestationRewardsStakedShared',
      'vdfRevelationRewardsStakedShared',
      'nonceRevelationRewardsStakedShared'
    ],
    []
  );
  const stakedEdgeRewardsShare =
    stakedEdgeRewards > 0 ? stakedEdgeRewards / (stakedEdgeRewards + stakedSharedRewards) : 0;
  const doubleOperationsStakedLoss = doubleBakingLostStaked + doubleEndorsingLostStaked + doublePreendorsingLostStaked;
  const j = doubleOperationsStakedLoss * (1 - stakedEdgeRewardsShare);
  const E = doubleOperationsStakedLoss - j;

  let P = 0,
    L = 0,
    S = 0,
    b = 0;
  if (futureRewards > 0) {
    const Vt = ownStakedBalance * limitOfStakingOverBaking;
    const at = ownStakedBalance + Math.min(externalStakedBalance, Vt);
    const N = (futureRewards * at) / bakingPower;
    P = futureRewards - N;
    L = (N * ownStakedBalance) / at;
    S = (N - L) * edgeOfBakingOverStaking;
    b = N - L - S;
  }

  const T = Math.max(0, +P + k - y);
  const x = T * delegationFeeRatio;
  const w =
    ownDelegatedBalance + externalDelegatedBalance > 0
      ? delegatedBalance / (ownDelegatedBalance + externalDelegatedBalance)
      : 0;
  const delegationRewardsAreSent = delegatedBalance / 1e6 >= minDelegation;

  const delegationFee = delegationRewardsAreSent ? Math.round(x * w) : 0;
  const Ft = Math.max(0, +S + stakedEdgeRewards - E);
  const stakedBalanceRatio = stakedBalance && externalStakedBalance > 0 ? stakedBalance / externalStakedBalance : 0;
  const stakingFee = Math.round(Ft * stakedBalanceRatio);
  const bakerFeeMutez = stakingFee + delegationFee;
  const doubleOperationsExternalStakedLoss =
    doubleBakingLostExternalStaked + doubleEndorsingLostExternalStaked + doublePreendorsingLostExternalStaked;
  const tt = Math.max(0, +S + b + stakedEdgeRewards - E + stakedSharedRewards - doubleOperationsExternalStakedLoss);
  const stakingReward = Math.round(tt * stakedBalanceRatio);
  const delegationReward = delegationRewardsAreSent ? Math.round(T * w) : 0;

  const rewards = stakingReward + delegationReward;
  const bakerFeeRatio = bakerFeeMutez / rewards;

  return {
    cycle: cycle.index,
    delegated: mutezToTz(delegatedBalance),
    bakerFeeRatio: Number.isFinite(bakerFeeRatio) ? bakerFeeRatio : delegationFeeRatio,
    bakerFee: mutezToTz(bakerFeeMutez),
    expectedPayout: mutezToTz(rewards - bakerFeeMutez),
    efficiency: assignedRewards === 0 ? 1 : totalRewards / assignedRewards,
    blockRewards: mutezToTz(
      blockRewardsDelegated + blockRewardsStakedOwn + blockRewardsStakedEdge + blockRewardsStakedShared
    ),
    blocks,
    blockFees: mutezToTz(blockFees),
    missedBlockRewards: mutezToTz(missedBlockRewards),
    missedBlocks,
    missedBlockFees: mutezToTz(missedBlockFees),
    attestationRewards: mutezToTz(
      attestationRewardsDelegated +
        attestationRewardsStakedOwn +
        attestationRewardsStakedEdge +
        attestationRewardsStakedShared
    ),
    attestations,
    missedAttestations,
    missedAttestationRewards: mutezToTz(missedAttestationRewards)
  };
}
