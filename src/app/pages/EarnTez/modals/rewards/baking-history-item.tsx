import React, { memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Button, Money } from 'app/atoms';
import { Tooltip } from 'app/atoms/Tooltip';
import { ReactComponent as HourglassIcon } from 'app/icons/base/hourglass.svg';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as RefreshIcon } from 'app/icons/base/refresh.svg';
import { ChartListItem, ChartListItemProps } from 'app/templates/chart-list-item';
import { T, TID, getPluralKey, t } from 'lib/i18n';
import { toPercentage } from 'lib/ui/utils';

import { BakerAvatar } from '../../components/baker-avatar';
import { BakerName } from '../../components/baker-name';

export interface BakingHistoryEntry {
  cycle: number;
  bakerAddress: string;
  bakerName?: string;
  delegated: BigNumber;
  bakerFeeRatio: number;
  bakerFee: BigNumber;
  expectedPayout: BigNumber;
  efficiency: number;
  blockRewards: BigNumber;
  blocks: number;
  blockFees: BigNumber;
  missedBlockRewards: BigNumber;
  missedBlocks: number;
  missedBlockFees: BigNumber;
  attestationRewards: BigNumber;
  attestations: number;
  missedAttestations: number;
  missedAttestationRewards: BigNumber;
  status: 'not_come' | 'in_progress' | 'finished';
}

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

const tooltipsTextsI18nKeys: Record<BakingHistoryEntry['status'], TID> = {
  not_come: 'cycleNotComeYet',
  in_progress: 'cycleInProgress',
  finished: 'rewardsReceived'
};

export const BakingHistoryItem = memo<BakingHistoryItemProps>(({ item, active, index, tezSymbol, onClick }) => {
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
    blocks,
    blockRewards,
    blockFees,
    missedBlocks,
    missedBlockFees,
    missedBlockRewards,
    attestations,
    attestationRewards,
    missedAttestations,
    missedAttestationRewards
  } = item;

  const handleClick = useCallback(() => onClick(index), [index, onClick]);

  const rewardsStatementsProps = useMemo<RewardsStatementProps[]>(
    () =>
      [
        {
          title: t('ownBlocks'),
          rewards: blockRewards,
          opportunityNameI18nKey: 'blocks' as const,
          opportunitiesCount: blocks,
          fees: blockFees
        },
        {
          title: t('missedOwnBlocks'),
          rewards: missedBlockRewards.negated(),
          opportunityNameI18nKey: 'blocks' as const,
          opportunitiesCount: missedBlocks,
          fees: missedBlockFees.negated()
        },
        {
          title: t('endorsements'),
          rewards: attestationRewards,
          opportunityNameI18nKey: 'slots' as const,
          opportunitiesCount: attestations,
          fees: new BigNumber(0)
        },
        {
          title: t('missedEndorsements'),
          rewards: missedAttestationRewards.negated(),
          opportunityNameI18nKey: 'slots' as const,
          opportunitiesCount: missedAttestations,
          fees: new BigNumber(0)
        }
      ]
        .filter(({ rewards, opportunitiesCount }) => !rewards.isZero() || opportunitiesCount !== 0)
        .map((entry, index, arr) => ({ ...entry, borderBottom: index !== arr.length - 1, tezSymbol })),
    [
      attestationRewards,
      attestations,
      blockFees,
      blockRewards,
      blocks,
      missedAttestationRewards,
      missedAttestations,
      missedBlockFees,
      missedBlockRewards,
      missedBlocks,
      tezSymbol
    ]
  );

  return (
    <Button
      className="flex flex-col p-4 rounded-lg gap-2 bg-white border-0.5 border-lines hover:bg-grey-4 text-left group"
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
          <Tooltip
            Icon={statusesIcons[status]}
            className={status === 'finished' ? 'text-success' : 'text-grey-2'}
            content={t(tooltipsTextsI18nKeys[status])}
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
            <div className="bg-grey-4 border-0.5 border-transparent group-hover:border-grey-3 rounded-xl flex flex-col">
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
    <div className="p-1 text-font-num-12">{children}</div>
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
    <div
      className={clsx(
        'flex flex-col p-3 gap-0.5',
        borderBottom && 'border-b-0.5 border-lines group-hover:border-grey-3'
      )}
    >
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
    {value.isNegative() && value.isZero() && '-'}
    <Money smallFractionFont={false} withSign>
      {value}
    </Money>{' '}
    {symbol}
  </span>
));
