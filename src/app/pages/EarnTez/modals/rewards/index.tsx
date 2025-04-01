import React, { memo, useCallback, useMemo, useState } from 'react';

import { identity, uniq } from 'lodash';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { BakingBadStory, bakingBadGetBakerStory } from 'lib/apis/baking-bad';
import { getDelegatorRewards, isKnownChainId } from 'lib/apis/tzkt';
import { fetchSetDelegateParametersOperations, getCycles, getProtocol } from 'lib/apis/tzkt/api';
import { TzktProtocol, TzktSetDelegateParamsOperation } from 'lib/apis/tzkt/types';
import { T } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { getRewardsStats } from 'lib/temple/front';
import { AccountForTezos } from 'temple/accounts';

import { BakingHistoryEntry, BakingHistoryItem } from './baking-history-item';

interface RewardsModalProps {
  account: AccountForTezos;
  bakerAddress: string | nullish;
  chainId: string;
  isOpen: boolean;
  onClose: EmptyFn;
}

export const RewardsModal = memo<RewardsModalProps>(({ account, bakerAddress, chainId, isOpen, onClose }) => (
  <PageModal
    title={<T id="rewardsActivity" />}
    opened={isOpen}
    onRequestClose={onClose}
    suspenseLoader={<PageLoader stretch />}
  >
    {isOpen && <PageModalContent account={account} bakerAddress={bakerAddress} chainId={chainId} />}
  </PageModal>
));

const DEFAULT_PROTOCOL: TzktProtocol = {
  hash: 'PsQuebecnLByd3JwTiGadoG4nGWi3HYiLXUjkibeFV8dCFeVMUg',
  constants: {
    endorsersPerBlock: 7000,
    consensusThreshold: 4667,
    blocksPerCycle: 30720,
    blockReward: [0],
    endorsementReward: [0]
  }
};

const FALLBACK_STORY: BakingBadStory = {
  address: '',
  name: [{ cycle: 0, value: '' }],
  status: [{ cycle: 0, value: 'active' }],
  delegationEnabled: [{ cycle: 0, value: true }],
  delegationFee: [{ cycle: 0, value: 0 }],
  delegationMinBalance: [{ cycle: 0, value: 0 }],
  stakingEnabled: [{ cycle: 0, value: true }],
  stakingFee: [{ cycle: 0, value: 0 }],
  stakingLimit: [{ cycle: 0, value: 0 }]
};

const getCycleValue = <T, U>(
  entries: T[],
  cycle: number,
  getCycle: (entry: T) => number,
  getValue: (entry: T) => U,
  defaultValue: U
) => {
  const prevEntry = entries.find(entry => getCycle(entry) < cycle);

  return prevEntry ? getValue(prevEntry) : defaultValue;
};

const PageModalContent = memo<Omit<RewardsModalProps, 'onClose' | 'isOpen'>>(({ account, bakerAddress, chainId }) => {
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const handleItemClick = useCallback(
    (index: number) => setActiveItemIndex(prevIndex => (prevIndex === index ? -1 : index)),
    []
  );
  const { symbol: tezSymbol } = getTezosGasMetadata(chainId);

  const getBakingHistory = useCallback(
    async ([, accountPkh, , chainId]: [string, string, string | nullish, string]) => {
      if (!isKnownChainId(chainId)) {
        return { rewards: [], cycles: {}, protocol: DEFAULT_PROTOCOL, setParamsOperations: {}, stories: {} };
      }

      const [rewards, cycles, protocol] = await Promise.all([
        getDelegatorRewards(chainId, { address: accountPkh, limit: 30 }).then(res => res || []),
        getCycles(chainId),
        getProtocol(chainId)
      ]);
      const bakersAddresses = uniq(rewards.map(({ baker }) => baker.address));
      const setParamsOperationsValues = await Promise.all(
        bakersAddresses.map(address =>
          fetchSetDelegateParametersOperations(chainId, { sender: address, 'sort.desc': 'level' })
        )
      );
      const storiesValues = await Promise.all(bakersAddresses.map(address => bakingBadGetBakerStory({ address })));

      return {
        rewards,
        cycles: Object.fromEntries(cycles.map(cycle => [cycle.index, cycle])),
        protocol,
        setParamsOperations: Object.fromEntries(
          bakersAddresses.map((address, i) => [address, setParamsOperationsValues[i]])
        ),
        stories: Object.fromEntries(bakersAddresses.map((address, i) => [address, storiesValues[i]]))
      };
    },
    []
  );

  const { data: bakingHistoryInput } = useRetryableSWR(
    ['baking-history', account.address, bakerAddress, chainId],
    getBakingHistory,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const bakingHistory = useMemo(() => {
    const { rewards, cycles, protocol, setParamsOperations, stories } = bakingHistoryInput!;

    const nowDate = new Date().toISOString();
    const currentCycleIndex = Object.values(cycles).find(
      ({ startTime, endTime }) => startTime <= nowDate && endTime > nowDate
    )!.index;

    return rewards.map((reward): BakingHistoryEntry => {
      const { cycle: cycleIndex, baker } = reward;
      const { address: bakerAddress, alias: bakerName } = baker;
      const cycle = cycles[cycleIndex];
      const bakerSetParamsOperations = setParamsOperations[bakerAddress];
      const { delegationMinBalance: minDelegationStory, delegationFee: delegationFeeStory } =
        stories[bakerAddress] ?? FALLBACK_STORY;

      const { limitOfStakingOverBaking, edgeOfBakingOverStaking } = getCycleValue<
        TzktSetDelegateParamsOperation,
        Record<'limitOfStakingOverBaking' | 'edgeOfBakingOverStaking', number>
      >(bakerSetParamsOperations, cycleIndex, op => op.activationCycle, identity, {
        limitOfStakingOverBaking: 0,
        edgeOfBakingOverStaking: 1e9
      });
      const delegationFee = getCycleValue(
        delegationFeeStory,
        cycleIndex,
        ({ cycle }) => cycle,
        ({ value }) => value,
        0
      );
      const minDelegation = getCycleValue(
        minDelegationStory,
        cycleIndex,
        ({ cycle }) => cycle,
        ({ value }) => value,
        0
      );

      return {
        ...getRewardsStats({
          rewardsEntry: reward,
          cycle,
          protocol,
          limitOfStakingOverBaking,
          edgeOfBakingOverStaking,
          delegationFee,
          minDelegation
        }),
        bakerAddress,
        bakerName,
        status:
          cycleIndex > currentCycleIndex ? 'not_come' : cycleIndex === currentCycleIndex ? 'in_progress' : 'finished'
      };
    });
  }, [bakingHistoryInput]);

  return (
    <ScrollView className="p-4 gap-4">
      {bakingHistory.length === 0 ? (
        <EmptyState forSearch={false} textI18n="noRewardsYet" stretch />
      ) : (
        bakingHistory.map((item, index) => (
          <BakingHistoryItem
            key={index}
            item={item}
            active={activeItemIndex === index}
            index={index}
            tezSymbol={tezSymbol}
            onClick={handleItemClick}
          />
        ))
      )}
    </ScrollView>
  );
});
