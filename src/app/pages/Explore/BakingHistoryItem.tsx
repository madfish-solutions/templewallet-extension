import React, { FC, SVGProps, useCallback, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";
import { Collapse } from "react-collapse";

import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import { ReactComponent as BoxCrossedIcon } from "app/icons/box-crossed.svg";
import { ReactComponent as BoxIcon } from "app/icons/box.svg";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as HourglassIcon } from "app/icons/hourglass.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import { ReactComponent as InProgressIcon } from "app/icons/rotate.svg";
import { ReactComponent as ShieldCancelIcon } from "app/icons/shield-cancel.svg";
import { ReactComponent as ShieldOkIcon } from "app/icons/shield-ok.svg";
import { ReactComponent as TimeIcon } from "app/icons/time.svg";
import HashChip from "app/templates/HashChip";
import { getPluralKey, toLocalFormat } from "lib/i18n/numbers";
import { T } from "lib/i18n/react";
import {
  getRewardsStats,
  mutezToTz,
  useExplorerBaseUrls,
  useKnownBaker,
} from "lib/temple/front";
import { TzktRewardsEntry } from "lib/tzkt";

import styles from "./BakingHistoryItem.module.css";

type BakingHistoryItemProps = {
  content: TzktRewardsEntry;
  currentCycle?: number;
} & Record<
  | "fallbackRewardPerOwnBlock"
  | "fallbackRewardPerEndorsement"
  | "fallbackRewardPerFutureBlock"
  | "fallbackRewardPerFutureEndorsement",
  BigNumber
>;

const BakingHistoryItem: FC<BakingHistoryItemProps> = ({
  content,
  currentCycle,
  fallbackRewardPerEndorsement,
  fallbackRewardPerFutureBlock,
  fallbackRewardPerFutureEndorsement,
  fallbackRewardPerOwnBlock,
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
    missedEndorsements,
  } = content;

  const { data: bakerDetails } = useKnownBaker(baker.address);
  const { account: accountBaseUrl } = useExplorerBaseUrls();
  const [showDetails, setShowDetails] = useState(false);

  const toggleShowDetails = useCallback(
    () => setShowDetails((prevValue) => !prevValue),
    []
  );

  const { StatusIcon, iconColor, title, statsEntriesProps } = useMemo(() => {
    const {
      balance,
      rewards,
      luck,
      bakerFeePart,
      bakerFee,
      cycleStatus,
      efficiency,
    } = getRewardsStats({
      rewardsEntry: content,
      bakerDetails,
      currentCycle,
      fallbackRewardPerEndorsement,
      fallbackRewardPerFutureBlock,
      fallbackRewardPerFutureEndorsement,
      fallbackRewardPerOwnBlock,
    });

    const { StatusIcon, iconColor, title } = (() => {
      switch (cycleStatus) {
        case "unlocked":
          return {
            StatusIcon: OkIcon,
            iconColor: "green-500",
            title: "Rewards unlocked",
          };
        case "locked":
          return {
            StatusIcon: TimeIcon,
            iconColor: "orange-500",
            title: "Rewards still locked",
          };
        case "future":
          return {
            StatusIcon: HourglassIcon,
            iconColor: "gray-500",
            title: "Future rewards",
          };
        default:
          return {
            StatusIcon: InProgressIcon,
            iconColor: "blue-600",
            title: "Cycle in progress",
          };
      }
    })();
    const luckPercentage = luck.times(100);
    const luckClassName = (() => {
      switch (true) {
        case luckPercentage.lt(-5):
          return "text-red-700";
        case luckPercentage.gt(5):
          return "text-green-500";
        default:
          return "text-gray-500";
      }
    })();
    const normalizedBalance = mutezToTz(balance);
    const normalizedRewards = mutezToTz(rewards);
    const normalizedBakerFee = mutezToTz(bakerFee);
    const efficiencyPercentage = efficiency.multipliedBy(100);
    const efficiencyClassName = (() => {
      switch (true) {
        case cycleStatus === "inProgress":
          return "text-blue-600";
        case efficiencyPercentage.gte(100):
          return "text-green-500";
        case efficiencyPercentage.gte(99):
          return "text-gray-500";
        default:
          return "text-red-700";
      }
    })();

    return {
      StatusIcon,
      iconColor,
      title,
      statsEntriesProps: [
        {
          name: "Delegated",
          value: (
            <>
              {normalizedBalance.lt(1) ? (
                "<1"
              ) : (
                <Money smallFractionFont={false}>
                  {mutezToTz(balance).decimalPlaces(0, BigNumber.ROUND_FLOOR)}
                </Money>
              )}{" "}
              ꜩ
            </>
          ),
        },
        {
          name: "Rewards & Luck",
          value: (
            <>
              <Money smallFractionFont={false}>{normalizedRewards}</Money> ꜩ
            </>
          ),
          valueComment: (
            <span className={luckClassName}>
              ({luckPercentage.gt(0) ? "+" : ""}
              {toLocalFormat(luckPercentage, { decimalPlaces: 0 })}%)
            </span>
          ),
        },
        {
          name: "Baker fee",
          value: `${bakerFeePart * 100}%`,
          valueComment: (
            <span className="text-gray-500">
              (<Money smallFractionFont={false}>{normalizedBakerFee}</Money> ꜩ)
            </span>
          ),
        },
        {
          name: "Expected payout",
          value:
            cycleStatus === "future" ? (
              "‒"
            ) : (
              <>
                <Money smallFractionFont={false}>
                  {normalizedRewards.minus(normalizedBakerFee)}
                </Money>{" "}
                ꜩ
              </>
            ),
        },
        {
          className: "pb-0",
          name: "Efficiency",
          value:
            cycleStatus === "future" ? (
              "‒"
            ) : (
              <span className={efficiencyClassName}>
                {toLocalFormat(efficiencyPercentage, { decimalPlaces: 2 })}%
              </span>
            ),
        },
      ],
    };
  }, [
    bakerDetails,
    content,
    currentCycle,
    fallbackRewardPerEndorsement,
    fallbackRewardPerFutureBlock,
    fallbackRewardPerFutureEndorsement,
    fallbackRewardPerOwnBlock,
  ]);

  const accordionItemsProps = useMemo<AccordionItemProps[]>(
    () =>
      [
        {
          Icon: BoxIcon,
          title: "Own blocks",
          children: (
            <T
              id="rewardsForBlocks"
              substitutions={[
                <span key={0} className="text-green-500">
                  +
                  <Money smallFractionFont={false}>
                    {mutezToTz(ownBlockRewards)}
                  </Money>{" "}
                  ꜩ
                </span>,
                <span key={1} className="text-blue-600">
                  {ownBlocks}
                </span>,
                <T id={getPluralKey("blocks", ownBlocks)} />,
                <span key={2} className="text-gray-600">
                  +
                  <Money smallFractionFont={false}>
                    {mutezToTz(ownBlockFees)}
                  </Money>{" "}
                  ꜩ
                </span>,
              ]}
            />
          ),
          visible: ownBlocks > 0,
        },
        {
          Icon: ShieldOkIcon,
          title: "Endorsements",
          children: (
            <T
              id="rewardsForSlots"
              substitutions={[
                <span key={0} className="text-green-500">
                  +
                  <Money smallFractionFont={false}>
                    {mutezToTz(endorsementRewards)}
                  </Money>{" "}
                  ꜩ
                </span>,
                <span key={1} className="text-blue-600">
                  {endorsements}
                </span>,
                <T id={getPluralKey("slots", endorsements)} />,
              ]}
            />
          ),
          visible: endorsements > 0,
        },
        {
          Icon: (props: SVGProps<SVGSVGElement>) => (
            <BoxCrossedIcon
              {...props}
              className={classNames(props.className, "fill-current")}
              style={{ stroke: "none" }}
            />
          ),
          title: "Missed own blocks",
          children: (
            <T
              id="rewardsForBlocks"
              substitutions={[
                <span key={0} className="text-orange-500">
                  -
                  <Money smallFractionFont={false}>
                    {mutezToTz(missedOwnBlockRewards)}
                  </Money>{" "}
                  ꜩ
                </span>,
                <span key={1} className="text-blue-600">
                  {missedOwnBlocks}
                </span>,
                <T id={getPluralKey("blocks", missedOwnBlocks)} />,
                <span key={2} className="text-gray-600">
                  -
                  <Money smallFractionFont={false}>
                    {mutezToTz(missedOwnBlockFees)}
                  </Money>{" "}
                  ꜩ
                </span>,
              ]}
            />
          ),
          visible: missedOwnBlocks > 0,
        },
        {
          Icon: ShieldCancelIcon,
          title: "Missed endorsements",
          children: (
            <T
              id="rewardsForSlots"
              substitutions={[
                <span key={0} className="text-orange-500">
                  -
                  <Money smallFractionFont={false}>
                    {mutezToTz(missedEndorsementRewards)}
                  </Money>{" "}
                  ꜩ
                </span>,
                <span key={1} className="text-blue-600">
                  {missedEndorsements}
                </span>,
                <T id={getPluralKey("slots", missedEndorsements)} />,
              ]}
            />
          ),
          visible: missedEndorsements > 0,
        },
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
    ]
  );

  return (
    <div
      className={classNames(
        "flex flex-col items-stretch px-4 mt-2 pt-4",
        "border-gray-300"
      )}
      style={{ borderTopWidth: 0.5 }}
    >
      <div className="flex flex-row relative">
        <div className="mr-2">
          {bakerDetails ? (
            <img
              className="w-6 h-auto"
              src={bakerDetails.logo}
              alt={bakerDetails.name}
            />
          ) : (
            <Identicon
              type="bottts"
              hash={baker.address}
              size={24}
              className="rounded-full"
            />
          )}
        </div>
        <div className="flex-1 relative">
          <h3 className="text-gray-700 text-lg leading-none mb-1">
            {bakerDetails?.name ?? <T id="unknownBakerTitle" />}
          </h3>
          <div className="flex">
            <HashChip
              bgShade={200}
              rounded="base"
              className="mr-1"
              hash={baker.address}
              small
              textShade={700}
            />
            {accountBaseUrl && (
              <OpenInExplorerChip
                bgShade={200}
                textShade={500}
                rounded="base"
                hash={baker.address}
                baseUrl={accountBaseUrl}
              />
            )}
          </div>
          {statsEntriesProps.map((props) => (
            <StatsEntry key={props.name} {...props} />
          ))}
          {accordionItemsProps.length > 0 && (
            <button
              className={classNames(
                "absolute right-0  bottom-0 flex items-center justify-center w-4 h-4 rounded",
                "bg-gray-200 text-gray-500 transform transition-transform duration-500",
                showDetails && "rotate-180"
              )}
              onClick={toggleShowDetails}
            >
              <ChevronDownIcon className="w-4 h-4 stroke-1 stroke-current" />
            </button>
          )}
        </div>
        <div
          className={classNames(
            "absolute flex items-center right-0",
            "text-sm font-medium text-gray-600 leading-tight"
          )}
          style={{ top: "-0.5rem" }}
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
        initialStyle={{ height: "0px", overflow: "hidden" }}
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

const AccordionItem: React.FC<AccordionItemProps> = ({
  Icon,
  title,
  children,
}) => (
  <div
    className="border-gray-300 pt-2 pb-3 font-medium"
    style={{ borderTopWidth: 0.5 }}
  >
    <div className="flex items-center text-xs text-gray-600 mb-1 leading-tight">
      <Icon
        aria-hidden={true}
        className="h-6 w-auto mr-1 stroke-2 stroke-current"
      />
      {title}
    </div>
    <span className="text-sm text-gray-700 font-medium">{children}</span>
  </div>
);

type StatsEntryProps = {
  name: string;
  value: React.ReactChild;
  valueComment?: React.ReactChild;
  className?: string;
};

const StatsEntry: FC<StatsEntryProps> = ({
  name,
  value,
  valueComment,
  className,
}) => (
  <div
    className={classNames(
      "text-gray-500 text-xs leading-tight py-1",
      className
    )}
  >
    <span className="mr-1">{name}:</span>
    <span className="text-gray-700">{value}</span>
    {valueComment && <span className="ml-1">{valueComment}</span>}
  </div>
);
