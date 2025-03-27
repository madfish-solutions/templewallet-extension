import React, { memo, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { identity, uniq } from 'lodash';

import { Button, IconBase, Money } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReactComponent as HourglassIcon } from 'app/icons/base/hourglass.svg';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as RefreshIcon } from 'app/icons/base/refresh.svg';
import { ChartListItem, ChartListItemProps } from 'app/templates/chart-list-item';
import { BakingBadStory, bakingBadGetBakerStory } from 'lib/apis/baking-bad';
import { getDelegatorRewards, isKnownChainId } from 'lib/apis/tzkt';
import { fetchSetDelegateParametersOperations, getCycles, getProtocol } from 'lib/apis/tzkt/api';
import { TzktProtocol, TzktSetDelegateParamsOperation } from 'lib/apis/tzkt/types';
import { T, getPluralKey, t } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { getRewardsStatsV2 } from 'lib/temple/front/baking';
import { toPercentage } from 'lib/ui/utils';
import { AccountForTezos } from 'temple/accounts';

import { BakerAvatar } from '../../components/baker-avatar';
import { BakerName } from '../../components/baker-name';

interface RewardsModalProps {
  account: AccountForTezos;
  bakerAddress: string | nullish;
  chainId: string;
  isOpen: boolean;
  onClose: EmptyFn;
}

interface BakingHistoryEntry {
  cycle: number;
  bakerAddress: string;
  bakerName?: string;
  delegated: BigNumber;
  bakerFeeRatio: number;
  bakerFee: BigNumber;
  expectedPayout: BigNumber;
  efficiency: number;
  ownBlockRewards: BigNumber;
  ownBlocks: number;
  ownBlockFees: BigNumber;
  missedOwnBlockRewards: BigNumber;
  missedOwnBlocks: number;
  missedOwnBlockFees: BigNumber;
  endorsementRewards: BigNumber;
  endorsements: number;
  missedEndorsements: number;
  missedEndorsementRewards: BigNumber;
  status: 'not_come' | 'in_progress' | 'finished';
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
        bakersAddresses.map(address => fetchSetDelegateParametersOperations(chainId, { sender: address }))
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

    const lastFutureRewardsEntry = rewards.findLast(
      ({ futureBlockRewards, futureEndorsementRewards }) => futureBlockRewards + futureEndorsementRewards > 0
    );
    const lastFutureRewardsCycle = lastFutureRewardsEntry?.cycle ?? cycles[0].index + 1;

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
        ...getRewardsStatsV2({
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
          cycleIndex > lastFutureRewardsCycle
            ? 'not_come'
            : cycleIndex === lastFutureRewardsCycle
            ? 'in_progress'
            : 'finished'
      };
    });
  }, [bakingHistoryInput]);

  return (
    <ScrollView className="p-4 gap-4">
      {bakingHistory.map((item, index) => (
        <BakingHistoryItem
          key={index}
          item={item}
          active={activeItemIndex === index}
          index={index}
          tezSymbol={tezSymbol}
          onClick={handleItemClick}
        />
      ))}
    </ScrollView>
  );
});

interface BakingHistoryItemProps {
  item: BakingHistoryEntry;
  active: boolean;
  index: number;
  tezSymbol: string;
  onClick: SyncFn<number>;
}

const statusesIcons = {
  not_come: HourglassIcon,
  in_progress: RefreshIcon,
  finished: OkFillIcon
};

const BakingHistoryItem = memo<BakingHistoryItemProps>(({ item, active, index, tezSymbol, onClick }) => {
  const {
    bakerAddress,
    bakerName,
    expectedPayout,
    status,
    cycle,
    delegated,
    bakerFeeRatio,
    bakerFee,
    efficiency,
    ownBlocks,
    ownBlockRewards,
    ownBlockFees,
    missedOwnBlocks,
    missedOwnBlockFees,
    missedOwnBlockRewards,
    endorsements,
    endorsementRewards,
    missedEndorsements,
    missedEndorsementRewards
  } = item;

  const handleClick = useCallback(() => onClick(index), [index, onClick]);

  const rewardsStatementsProps = useMemo<RewardsStatementProps[]>(
    () =>
      [
        {
          title: t('ownBlocks'),
          rewards: ownBlockRewards,
          opportunityNameI18nKey: 'blocks' as const,
          opportunitiesCount: ownBlocks,
          fees: ownBlockFees
        },
        {
          title: t('missedOwnBlocks'),
          rewards: missedOwnBlockRewards.negated(),
          opportunityNameI18nKey: 'blocks' as const,
          opportunitiesCount: missedOwnBlocks,
          fees: missedOwnBlockFees.negated()
        },
        {
          title: t('endorsements'),
          rewards: endorsementRewards,
          opportunityNameI18nKey: 'slots' as const,
          opportunitiesCount: endorsements,
          fees: new BigNumber(0)
        },
        {
          title: t('missedEndorsements'),
          rewards: missedEndorsementRewards.negated(),
          opportunityNameI18nKey: 'slots' as const,
          opportunitiesCount: missedEndorsements,
          fees: new BigNumber(0)
        }
      ]
        .filter(({ rewards, opportunitiesCount }) => !rewards.isZero() || opportunitiesCount !== 0)
        .map((entry, index, arr) => ({ ...entry, borderBottom: index !== arr.length - 1, tezSymbol })),
    [
      endorsementRewards,
      endorsements,
      missedEndorsementRewards,
      missedEndorsements,
      missedOwnBlockFees,
      missedOwnBlockRewards,
      missedOwnBlocks,
      ownBlockFees,
      ownBlockRewards,
      ownBlocks,
      tezSymbol
    ]
  );

  return (
    <Button
      className="flex flex-col p-4 rounded-lg gap-2 shadow-bottom border-0.5 border-transparent hover:border-lines text-left"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BakerAvatar address={bakerName && bakerAddress} bakerName={bakerName} />
          <BakerName>{bakerName ?? <T id="unknownBakerTitle" />}</BakerName>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-font-num-14">
            <Money smallFractionFont={false}>{expectedPayout}</Money> {tezSymbol}
          </span>
          <IconBase
            size={16}
            className={status === 'finished' ? 'text-success' : 'text-grey-2'}
            Icon={statusesIcons[status]}
          />
        </div>
      </div>
      {active && (
        <>
          <div className="flex flex-col">
            <NumericChartListItem title={<T id="cycle" />}>{cycle}</NumericChartListItem>
            <NumericChartListItem title={<T id="delegated" />}>
              <Money smallFractionFont={false}>{delegated}</Money> {tezSymbol}
            </NumericChartListItem>
            <ChartListItem title={<T id="bakerFee" />}>
              <div className="flex items-center gap-0.5">
                <span className="m-1 text-grey-1 text-font-description">
                  <Money smallFractionFont={false}>{bakerFee}</Money> {tezSymbol}
                  {'  |'}
                </span>
                <span className="text-font-description">{toPercentage(bakerFeeRatio)}</span>
              </div>
            </ChartListItem>
            <NumericChartListItem bottomSeparator={status === 'finished'} title={<T id="expectedPayout" />}>
              <Money smallFractionFont={false}>{expectedPayout}</Money> {tezSymbol}
            </NumericChartListItem>
            {status === 'finished' && (
              <NumericChartListItem title={<T id="efficiency" />} bottomSeparator={false}>
                {toPercentage(efficiency)}
              </NumericChartListItem>
            )}
          </div>
          {rewardsStatementsProps.length > 0 && (
            <div className="bg-grey-4 rounded-xl flex flex-col">
              {rewardsStatementsProps.map(props => (
                <RewardsStatement key={props.title} {...props} />
              ))}
            </div>
          )}
        </>
      )}
    </Button>
  );
});

const NumericChartListItem = memo<ChartListItemProps>(({ children, ...restProps }) => (
  <ChartListItem {...restProps}>
    <p className="p-1 text-font-num-12">{children}</p>
  </ChartListItem>
));

interface RewardsStatementProps {
  tezSymbol: string;
  title: string;
  rewards: BigNumber;
  opportunityNameI18nKey: 'blocks' | 'slots';
  opportunitiesCount: number;
  fees: BigNumber;
  borderBottom: boolean;
}

const RewardsStatement = memo<RewardsStatementProps>(
  ({ title, rewards, opportunityNameI18nKey, opportunitiesCount, fees, borderBottom, tezSymbol }) => (
    <div className={clsx('flex flex-col p-3 gap-0.5', borderBottom && 'border-b-0.5 border-lines')}>
      <span className="text-font-description-bold text-grey-1 m-1">{title}</span>
      <span className="text-font-description text-grey-1">
        <T
          id="rewardsForOpportunities"
          substitutions={[
            <RewardsTezValue key={0} value={rewards} symbol={tezSymbol} />,
            <span key={1}>{opportunitiesCount}</span>,
            <T key={2} id={getPluralKey(opportunityNameI18nKey, opportunitiesCount)} />
          ]}
        />
      </span>
      {!fees.isZero() && (
        <span className="text-font-description text-grey-1">
          <T id="feesForOpportunities" substitutions={<RewardsTezValue value={fees} symbol={tezSymbol} key={0} />} />
        </span>
      )}
    </div>
  )
);

interface RewardsTezValueProps {
  value: BigNumber;
  symbol: string;
}

const RewardsTezValue = memo<RewardsTezValueProps>(({ value, symbol }) => (
  <span className={clsx('text-font-num-12', value.isPositive() ? 'text-success' : 'text-text')}>
    {!value.isPositive() && value.isZero() && '-'}
    <Money smallFractionFont={false} withSign>
      {value}
    </Money>{' '}
    {symbol}
  </span>
));
