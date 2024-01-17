import React, { FC, SVGProps, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Collapse } from 'react-collapse';

import { Money, HashChip } from 'app/atoms';
import Identicon from 'app/atoms/Identicon';
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
import { useGasToken } from 'lib/assets/hooks';
import { getPluralKey, toLocalFormat, T } from 'lib/i18n';
import { getRewardsStats, useKnownBaker } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';

import styles from './BakingHistoryItem.module.css';

type BakingHistoryItemProps = {
  content: TzktRewardsEntry;
  currentCycle?: number;
} & Record<
  | 'fallbackRewardPerOwnBlock'
  | 'fallbackRewardPerEndorsement'
  | 'fallbackRewardPerFutureBlock'
  | 'fallbackRewardPerFutureEndorsement',
  BigNumber
>;

const BakingHistoryItem: FC<BakingHistoryItemProps> = ({
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

  const { data: bakerDetails } = useKnownBaker(baker.address);
  const [showDetails, setShowDetails] = useState(false);

  const { isDcpNetwork, symbol } = useGasToken();

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
            <span className="flex items-center">
              {normalizedBalance.lt(1) ? (
                '<1'
              ) : (
                <Money smallFractionFont={false}>{mutezToTz(balance).decimalPlaces(0, BigNumber.ROUND_FLOOR)}</Money>
              )}
              <span>{symbol}</span>
            </span>
          )
        },
        {
          name: 'Rewards & Luck',
          value: (
            <span className="flex items-center">
              <Money smallFractionFont={false}>{normalizedRewards}</Money>
              <span>{symbol}</span>
            </span>
          ),
          valueComment: (
            <span className={classNames('flex items-center', luckClassName)}>
              ({luckPercentage.gt(0) ? '+' : ''}
              {toLocalFormat(luckPercentage, { decimalPlaces: 0 })}%)
            </span>
          )
        },
        {
          name: 'Baker fee',
          value: `${bakerFeePart * 100}%`,
          valueComment: (
            <span className="text-gray-500 flex items-center">
              (<Money smallFractionFont={false}>{normalizedBakerFee}</Money>
              <span>{symbol}</span>)
            </span>
          )
        },
        {
          name: 'Expected payout',
          value:
            cycleStatus === 'future' ? (
              '‒'
            ) : (
              <span className="flex items-center">
                <Money smallFractionFont={false}>{normalizedRewards.minus(normalizedBakerFee)}</Money>
                <span>{symbol}</span>
              </span>
            )
        },
        {
          className: 'pb-0',
          name: 'Efficiency',
          value:
            cycleStatus === 'future' ? (
              '‒'
            ) : (
              <span className={classNames('flex items-center', efficiencyClassName)}>
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
          Icon: (props: SVGProps<SVGSVGElement>) => (
            <BoxCrossedIcon
              {...props}
              className={classNames(props.className, 'fill-current')}
              style={{ stroke: 'none' }}
            />
          ),
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
    <div
      className={classNames('flex flex-col items-stretch px-4 mt-2 pt-4', 'border-gray-300')}
      style={{ borderTopWidth: 0.5 }}
    >
      <div className="flex flex-row relative">
        <div className="mr-2">
          {bakerDetails ? (
            <img className="w-6 h-auto" src={bakerDetails.logo} alt={bakerDetails.name} />
          ) : (
            <Identicon type="bottts" hash={baker.address} size={24} className="rounded-full" />
          )}
        </div>
        <div className="flex-1 relative">
          {!isDcpNetwork && (
            <h3 className="text-gray-700 text-lg leading-none mb-1">
              {bakerDetails?.name ?? <T id="unknownBakerTitle" />}
            </h3>
          )}

          <div className="flex">
            <HashChip bgShade={200} rounded="base" className="mr-1" hash={baker.address} small textShade={700} />

            <OpenInExplorerChip hash={baker.address} type="account" small alternativeDesign />
          </div>

          {statsEntriesProps.map(props => (
            <StatsEntry key={props.name} {...props} />
          ))}

          {accordionItemsProps.length > 0 && (
            <button
              className={classNames(
                'absolute right-0  bottom-0 flex items-center justify-center w-4 h-4 rounded',
                'bg-gray-200 text-gray-500 transform transition-transform duration-500',
                showDetails && 'rotate-180'
              )}
              onClick={toggleShowDetails}
            >
              <ChevronDownIcon className="w-4 h-4 stroke-1 stroke-current" />
            </button>
          )}
        </div>

        <div
          className={classNames(
            'absolute flex items-center right-0',
            'text-sm font-medium text-gray-600 leading-tight'
          )}
          style={{ top: '-0.5rem' }}
        >
          {cycle}
          <span className={`text-${iconColor} ml-1`} title={title}>
            <StatusIcon className="h-4 w-auto stroke-2 stroke-current" />
          </span>
        </div>
      </div>
      <Collapse
        theme={{ collapse: styles.ReactCollapse }}
        isOpened={showDetails}
        initialStyle={{ height: '0px', overflow: 'hidden' }}
      >
        <div className="flex flex-col ml-8 mt-2">
          {accordionItemsProps.map((props, i) => (
            <AccordionItem key={i} {...props} />
          ))}
        </div>
      </Collapse>
    </div>
  );
};

export default BakingHistoryItem;

type AccordionItemProps = {
  Icon: FC<SVGProps<SVGSVGElement>>;
  title: string;
  children: React.ReactChild | React.ReactChild[];
};

const AccordionItem: React.FC<AccordionItemProps> = ({ Icon, title, children }) => (
  <div className="border-gray-300 pt-2 pb-3 font-medium" style={{ borderTopWidth: 0.5 }}>
    <div className="flex items-center text-xs text-gray-600 mb-1 leading-tight">
      <Icon aria-hidden={true} className="h-6 w-auto mr-1 stroke-2 stroke-current" />
      {title}
    </div>
    <span className="text-sm text-gray-700 font-medium flex gap-1 flex-wrap">{children}</span>
  </div>
);

type StatsEntryProps = {
  name: string;
  value: React.ReactChild;
  valueComment?: React.ReactChild;
  className?: string;
};

const StatsEntry: FC<StatsEntryProps> = ({ name, value, valueComment, className }) => (
  <div className={classNames('text-gray-500 text-xs leading-tight py-1 flex items-center', className)}>
    <span className="mr-1">{name}:</span>
    <span className="text-gray-700">{value}</span>
    {valueComment && <span className="ml-1">{valueComment}</span>}
  </div>
);
