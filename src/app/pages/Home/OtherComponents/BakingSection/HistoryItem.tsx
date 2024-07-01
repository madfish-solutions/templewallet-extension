import React, { memo, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Collapse } from 'react-collapse';

import { Money, HashChip } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { ReactComponent as BoxCrossedIcon } from 'app/icons/box-crossed.svg';
import { ReactComponent as BoxIcon } from 'app/icons/box.svg';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as HourglassIcon } from 'app/icons/hourglass.svg';
import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import { ReactComponent as InProgressIcon } from 'app/icons/rotate.svg';
import { ReactComponent as ShieldCancelIcon } from 'app/icons/shield-cancel.svg';
import { ReactComponent as ShieldOkIcon } from 'app/icons/shield-ok.svg';
import { ReactComponent as TimeIcon } from 'app/icons/time.svg';
import { OpenInExplorerChip } from 'app/templates/OpenInExplorerChip';
import { TzktRewardsEntry } from 'lib/apis/tzkt';
import { getTezosGasSymbol } from 'lib/assets';
import { getPluralKey, toLocalFormat, T } from 'lib/i18n';
import { getRewardsStats, useKnownBaker } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';
import { isTezosDcpChainId } from 'temple/networks';

import ModStyles from './styles.module.css';

type BakingHistoryItemProps = {
  tezosChainId: string;
  content: TzktRewardsEntry;
  currentCycle?: number;
} & Record<
  | 'fallbackRewardPerOwnBlock'
  | 'fallbackRewardPerEndorsement'
  | 'fallbackRewardPerFutureBlock'
  | 'fallbackRewardPerFutureEndorsement',
  BigNumber
>;

const BakingHistoryItem = memo<BakingHistoryItemProps>(
  ({
    tezosChainId,
    content,
    currentCycle,
    fallbackRewardPerEndorsement,
    fallbackRewardPerFutureBlock,
    fallbackRewardPerFutureEndorsement,
    fallbackRewardPerOwnBlock
  }) => {
    const {
      cycle,
      baker,
      ownBlockRewards,
      endorsementRewards,
      ownBlocks,
      endorsements,
      ownBlockFees,
      missedEndorsementRewards,
      missedOwnBlockFees,
      missedOwnBlockRewards,
      missedOwnBlocks,
      missedEndorsements
    } = content;

    const { data: bakerDetails } = useKnownBaker(baker.address, tezosChainId);
    const [showDetails, setShowDetails] = useState(false);

    const isDcpNetwork = isTezosDcpChainId(tezosChainId);
    const symbol = getTezosGasSymbol(tezosChainId);

    const toggleShowDetails = useCallback(() => setShowDetails(prevValue => !prevValue), []);

    const { StatusIcon, iconColor, title, statsEntriesProps } = useMemo(() => {
      const { balance, rewards, luck, bakerFeePart, bakerFee, cycleStatus, efficiency } = getRewardsStats({
        rewardsEntry: content,
        bakerDetails,
        currentCycle,
        fallbackRewardPerEndorsement,
        fallbackRewardPerFutureBlock,
        fallbackRewardPerFutureEndorsement,
        fallbackRewardPerOwnBlock
      });

      const { OperationIcon, iconClass, iconText } = (() => {
        switch (cycleStatus) {
          case 'unlocked':
            return {
              OperationIcon: OkIcon,
              iconClass: 'green-500',
              iconText: 'Rewards unlocked'
            };
          case 'locked':
            return {
              OperationIcon: TimeIcon,
              iconClass: 'orange-500',
              iconText: 'Rewards still locked'
            };
          case 'future':
            return {
              OperationIcon: HourglassIcon,
              iconClass: 'gray-500',
              iconText: 'Future rewards'
            };
          default:
            return {
              OperationIcon: InProgressIcon,
              iconClass: 'blue-600',
              iconText: 'Cycle in progress'
            };
        }
      })();
      const luckPercentage = luck.times(100);
      const luckClassName = (() => {
        switch (true) {
          case luckPercentage.lt(-5):
            return 'text-red-700';
          case luckPercentage.gt(5):
            return 'text-green-500';
          default:
            return 'text-gray-500';
        }
      })();
      const normalizedBalance = mutezToTz(balance);
      const normalizedRewards = mutezToTz(rewards);
      const normalizedBakerFee = mutezToTz(bakerFee);
      const efficiencyPercentage = efficiency.multipliedBy(100);
      const efficiencyClassName = (() => {
        switch (true) {
          case cycleStatus === 'inProgress':
            return 'text-blue-600';
          case efficiencyPercentage.gte(100):
            return 'text-green-500';
          case efficiencyPercentage.gte(99):
            return 'text-gray-500';
          default:
            return 'text-red-700';
        }
      })();

      return {
        StatusIcon: OperationIcon,
        iconColor: iconClass,
        title: iconText,
        statsEntriesProps: [
          {
            name: 'Delegated',
            value: (
              <>
                {normalizedBalance.lt(1) ? (
                  '<1'
                ) : (
                  <Money smallFractionFont={false}>{mutezToTz(balance).decimalPlaces(0, BigNumber.ROUND_FLOOR)}</Money>
                )}
                <span>{symbol}</span>
              </>
            )
          },
          {
            name: 'Rewards & Luck',
            value: (
              <>
                <Money smallFractionFont={false}>{normalizedRewards}</Money>
                <span>{symbol}</span>
              </>
            ),
            valueComment: (
              <span className={luckClassName}>
                ({luckPercentage.gt(0) ? '+' : ''}
                {toLocalFormat(luckPercentage, { decimalPlaces: 0 })}%)
              </span>
            )
          },
          {
            name: 'Baker fee',
            value: `${bakerFeePart * 100}%`,
            valueComment: (
              <>
                (<Money smallFractionFont={false}>{normalizedBakerFee}</Money>
                <span>{symbol}</span>)
              </>
            )
          },
          {
            name: 'Expected payout',
            value:
              cycleStatus === 'future' ? (
                '‒'
              ) : (
                <>
                  <Money smallFractionFont={false}>{normalizedRewards.minus(normalizedBakerFee)}</Money>
                  <span>{symbol}</span>
                </>
              )
          },
          {
            name: 'Efficiency',
            value:
              cycleStatus === 'future' ? (
                '‒'
              ) : (
                <span className={efficiencyClassName}>
                  {toLocalFormat(efficiencyPercentage, { decimalPlaces: 2 })}%
                </span>
              )
          }
        ]
      };
    }, [
      bakerDetails,
      content,
      currentCycle,
      fallbackRewardPerEndorsement,
      fallbackRewardPerFutureBlock,
      fallbackRewardPerFutureEndorsement,
      fallbackRewardPerOwnBlock,
      symbol
    ]);

    const accordionItemsProps = useMemo<AccordionItemProps[]>(
      () =>
        [
          {
            Icon: BoxIcon,
            title: 'Own blocks',
            children: (
              <T
                id="rewardsForBlocks"
                substitutions={[
                  <span key={0} className="text-green-500 flex">
                    +<Money smallFractionFont={false}>{mutezToTz(ownBlockRewards)}</Money>
                    <span>{symbol}</span>
                  </span>,
                  <span key={1} className="text-blue-600">
                    {ownBlocks}
                  </span>,
                  <T id={getPluralKey('blocks', ownBlocks)} />,
                  <span key={2} className="text-gray-600 flex">
                    +<Money smallFractionFont={false}>{mutezToTz(ownBlockFees)}</Money>
                    <span>{symbol}</span>
                  </span>
                ]}
              />
            ),
            visible: ownBlocks > 0
          },
          {
            Icon: ShieldOkIcon,
            title: 'Endorsements',
            children: (
              <T
                id="rewardsForSlots"
                substitutions={[
                  <span key={0} className="text-green-500 flex">
                    +<Money smallFractionFont={false}>{mutezToTz(endorsementRewards)}</Money>
                    <span>{symbol}</span>
                  </span>,
                  <span key={1} className="text-blue-600 flex">
                    {endorsements}
                  </span>,
                  <T id={getPluralKey('slots', endorsements)} />
                ]}
              />
            ),
            visible: endorsements > 0
          },
          {
            Icon: ShieldCancelIcon,
            title: 'Missed endorsements',
            children: (
              <T
                id="rewardsForSlots"
                substitutions={[
                  <span key={0} className="text-orange-500 flex">
                    -<Money smallFractionFont={false}>{mutezToTz(missedEndorsementRewards)}</Money>
                    <span>{symbol}</span>
                  </span>,
                  <span key={1} className="text-blue-600 flex">
                    {missedEndorsements}
                  </span>,
                  <T id={getPluralKey('slots', missedEndorsements)} />
                ]}
              />
            ),
            visible: missedEndorsements > 0
          },
          {
            Icon: BoxCrossedIcon,
            title: 'Missed own blocks',
            children: (
              <T
                id="rewardsForBlocks"
                substitutions={[
                  <span key={0} className="text-orange-500 flex">
                    -<Money smallFractionFont={false}>{mutezToTz(missedOwnBlockRewards)}</Money>
                    <span>{symbol}</span>
                  </span>,
                  <span key={1} className="text-blue-600 flex">
                    {missedOwnBlocks}
                  </span>,
                  <T id={getPluralKey('blocks', missedOwnBlocks)} />,
                  <span key={2} className="text-gray-600 flex">
                    -<Money smallFractionFont={false}>{mutezToTz(missedOwnBlockFees)}</Money>
                    <span>{symbol}</span>
                  </span>
                ]}
              />
            ),
            visible: missedOwnBlocks > 0
          }
        ].filter(({ visible }) => visible),
      [
        ownBlocks,
        ownBlockFees,
        ownBlockRewards,
        endorsements,
        endorsementRewards,
        missedOwnBlocks,
        missedOwnBlockRewards,
        missedOwnBlockFees,
        missedEndorsements,
        missedEndorsementRewards,
        symbol
      ]
    );

    return (
      <div className="flex flex-col mt-2 pt-2 border-t border-gray-300">
        <div className="py-1 flex gap-x-2 relative">
          <div className="w-6">
            {bakerDetails ? (
              <img
                className="w-full h-auto border border-gray-300 rounded"
                src={bakerDetails.logo}
                alt={bakerDetails.name}
              />
            ) : (
              <AccountAvatar seed={baker.address} size={24} className="rounded-full" />
            )}
          </div>

          <div className="flex-1 relative">
            {!isDcpNetwork && (
              <h3 className="text-blue-750 text-lg leading-none">
                {bakerDetails?.name ?? <T id="unknownBakerTitle" />}
              </h3>
            )}

            <div className="mt-1 flex">
              <HashChip bgShade={200} rounded="base" className="mr-1" hash={baker.address} small textShade={700} />

              <OpenInExplorerChip tezosChainId={tezosChainId} hash={baker.address} small alternativeDesign />
            </div>

            <div className="mt-2 flex flex-col gap-y-2">
              {statsEntriesProps.map(props => (
                <StatsEntry key={props.name} {...props} />
              ))}
            </div>

            {accordionItemsProps.length > 0 && (
              <button
                className={clsx(
                  'absolute right-0 bottom-0 bg-gray-200 rounded',
                  'transform transition-transform duration-500',
                  showDetails && 'rotate-180'
                )}
                onClick={toggleShowDetails}
              >
                <ChevronDownIcon className="w-4 h-4 stroke-current text-gray-500" />
              </button>
            )}
          </div>

          <div
            className={clsx(
              'absolute flex items-center gap-x-1 top-4 right-0',
              'text-sm font-medium text-gray-600 leading-tight'
            )}
          >
            {cycle}
            <StatusIcon className={clsx('h-4 w-auto stroke-2 stroke-current', `text-${iconColor}`)} title={title} />
          </div>
        </div>

        <Collapse
          theme={{ collapse: ModStyles.reactCollapse }}
          isOpened={showDetails}
          initialStyle={{ height: '0px', overflow: 'hidden' }}
        >
          <div className="mt-2 pl-8 flex flex-col gap-y-3">
            {accordionItemsProps.map((props, i) => (
              <AccordionItem key={i} {...props} />
            ))}
          </div>
        </Collapse>
      </div>
    );
  }
);

export default BakingHistoryItem;

interface AccordionItemProps {
  Icon: ImportedSVGComponent;
  title: string;
  children: React.ReactNode;
}

const AccordionItem = memo<AccordionItemProps>(({ Icon, title, children }) => (
  <div className="pt-2 font-medium border-t border-gray-300">
    <div className="flex items-center gap-x-1 text-xs text-gray-600 mb-1 leading-tight">
      <Icon aria-hidden={true} className="h-6 w-auto stroke-current fill-current" />
      {title}
    </div>

    <div className="text-sm text-blue-750 flex gap-1 flex-wrap">{children}</div>
  </div>
));

interface StatsEntryProps {
  name: string;
  value: React.ReactNode;
  valueComment?: React.ReactNode;
}

const StatsEntry = memo<StatsEntryProps>(({ name, value, valueComment }) => (
  <div className="text-xs leading-tight flex items-center gap-x-1">
    <span className="text-gray-500">{name}:</span>
    <div className="text-blue-750">{value}</div>
    {valueComment && <div className="text-gray-500">{valueComment}</div>}
  </div>
));
