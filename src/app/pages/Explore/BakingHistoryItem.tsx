import React, { FC, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import { ReactComponent as HourglassIcon } from "app/icons/hourglass.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import { ReactComponent as InProgressIcon } from "app/icons/rotate.svg";
import HashChip from "app/templates/HashChip";
import { toLocalFormat } from "lib/i18n/numbers";
import { T } from "lib/i18n/react";
import {
  mutezToTz,
  useExplorerBaseUrls,
  useKnownBaker,
} from "lib/temple/front";
import { TzktRewardsEntry } from "lib/tzkt";

type BakingHistoryItemProps = {
  content: TzktRewardsEntry;
} & Record<
  | "fallbackRewardPerOwnBlock"
  | "fallbackRewardPerEndorsement"
  | "fallbackRewardPerFutureBlock"
  | "fallbackRewardPerFutureEndorsement",
  BigNumber
>;

const BakingHistoryItem: FC<BakingHistoryItemProps> = ({
  content,
  fallbackRewardPerEndorsement,
  fallbackRewardPerFutureBlock,
  fallbackRewardPerFutureEndorsement,
  fallbackRewardPerOwnBlock,
}) => {
  const {
    cycle,
    baker,
    balance,
    ownBlockRewards,
    extraBlockRewards,
    futureBlockRewards,
    endorsementRewards,
    futureEndorsementRewards,
    stakingBalance,
    expectedBlocks,
    expectedEndorsements,
    ownBlocks,
    // extraBlocks,
    futureBlocks,
    futureEndorsements,
    endorsements,
    ownBlockFees,
    extraBlockFees,
    /* missedEndorsementRewards,
    missedExtraBlockRewards,
    missedExtraBlockFees,
    missedOwnBlockFees,
    missedOwnBlockRewards, */
  } = content;

  const { data: bakerDetails } = useKnownBaker(baker.address);
  const { account: accountBaseUrl } = useExplorerBaseUrls();

  const { StatusIcon, iconColor, title, statsEntriesProps } = useMemo(() => {
    const totalFutureRewards = new BigNumber(futureEndorsementRewards).plus(
      futureBlockRewards
    );
    const totalCurrentRewards = new BigNumber(extraBlockRewards)
      .plus(endorsementRewards)
      .plus(ownBlockRewards)
      .plus(ownBlockFees)
      .plus(extraBlockFees);
    const { StatusIcon, iconColor, title } = (() => {
      switch (true) {
        case totalFutureRewards.eq(0):
          return {
            StatusIcon: OkIcon,
            iconColor: "green-500",
            title: "Rewards unlocked",
          };
        case totalCurrentRewards.eq(0):
          return {
            StatusIcon: HourglassIcon,
            iconColor: "gray-500",
            title: "Future rewards",
          };
        default:
          return {
            StatusIcon: InProgressIcon,
            iconColor: "blue-400",
            title: "Cycle in progress",
          };
      }
    })();
    const totalRewards = totalFutureRewards.plus(totalCurrentRewards);
    const rewards = totalRewards.multipliedBy(balance).div(stakingBalance);
    let luckPercentage =
      expectedBlocks + expectedEndorsements > 0
        ? new BigNumber(-100)
        : new BigNumber(0);
    if (totalFutureRewards.plus(totalCurrentRewards).gt(0)) {
      const rewardPerOwnBlock =
        ownBlocks === 0
          ? fallbackRewardPerOwnBlock
          : new BigNumber(ownBlockRewards).div(ownBlocks);
      const rewardPerEndorsement =
        endorsements === 0
          ? fallbackRewardPerEndorsement
          : new BigNumber(endorsementRewards).div(endorsements);
      const asIfNoFutureExpectedBlockRewards = new BigNumber(
        expectedBlocks
      ).multipliedBy(rewardPerOwnBlock);
      const asIfNoFutureExpectedEndorsementRewards = new BigNumber(
        expectedEndorsements
      ).multipliedBy(rewardPerEndorsement);
      const asIfNoFutureExpectedRewards = asIfNoFutureExpectedBlockRewards.plus(
        asIfNoFutureExpectedEndorsementRewards
      );

      const rewardPerFutureBlock =
        futureBlocks === 0
          ? fallbackRewardPerFutureBlock
          : new BigNumber(futureBlockRewards).div(futureBlocks);
      const rewardPerFutureEndorsement =
        futureEndorsements === 0
          ? fallbackRewardPerFutureEndorsement
          : new BigNumber(futureEndorsementRewards).div(futureEndorsements);
      const asIfNoCurrentExpectedBlockRewards = new BigNumber(
        expectedBlocks
      ).multipliedBy(rewardPerFutureBlock);
      const asIfNoCurrentExpectedEndorsementRewards = new BigNumber(
        expectedEndorsements
      ).multipliedBy(rewardPerFutureEndorsement);
      const asIfNoCurrentExpectedRewards = asIfNoCurrentExpectedBlockRewards.plus(
        asIfNoCurrentExpectedEndorsementRewards
      );

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

      luckPercentage = totalRewards
        .minus(totalExpectedRewards)
        .div(totalExpectedRewards)
        .multipliedBy(100)
        .decimalPlaces(0);
    }
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
    const bakerFee = normalizedRewards
      .multipliedBy(bakerFeePart)
      .decimalPlaces(6);

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
                <Money>{mutezToTz(balance).decimalPlaces(0)}</Money>
              )}{" "}
              ꜩ
            </>
          ),
        },
        {
          name: "Rewards & Luck",
          value: (
            <>
              <Money>{normalizedRewards}</Money> ꜩ
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
              (<Money>{bakerFee}</Money> ꜩ)
            </span>
          ),
        },
        {
          name: "Expected payout",
          value: (
            <>
              <Money>{normalizedRewards.minus(bakerFee)}</Money> ꜩ
            </>
          ),
        },
      ],
    };
  }, [
    balance,
    cycle,
    ownBlockRewards,
    extraBlockRewards,
    futureBlockRewards,
    endorsementRewards,
    futureEndorsementRewards,
    stakingBalance,
    expectedBlocks,
    expectedEndorsements,
    ownBlocks,
    // extraBlocks,
    futureBlocks,
    futureEndorsements,
    endorsements,
    ownBlockFees,
    extraBlockFees,
    bakerDetails,
    fallbackRewardPerEndorsement,
    fallbackRewardPerFutureBlock,
    fallbackRewardPerFutureEndorsement,
    fallbackRewardPerOwnBlock,
    /* missedEndorsementRewards,
    missedExtraBlockRewards,
    missedExtraBlockFees,
    missedOwnBlockFees,
    missedOwnBlockRewards, */
  ]);

  return (
    <div
      key={`${cycle},${baker.address}`}
      className={classNames(
        "flex flex-row relative mx-4 mt-2 pt-4 pb-1",
        "border-t border-gray-300"
      )}
    >
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
      <div className="flex-1">
        <h3 className="text-gray-700 text-lg leading-none mb-1">
          {bakerDetails?.name ?? <T id="unknownBakerTitle" />}
        </h3>
        <div className="flex">
          <HashChip className="mr-2" hash={baker.address} small />
          {accountBaseUrl && (
            <OpenInExplorerChip hash={baker.address} baseUrl={accountBaseUrl} />
          )}
        </div>
        {statsEntriesProps.map((props) => (
          <StatsEntry key={props.name} {...props} />
        ))}
      </div>
      <div
        className={classNames(
          "absolute flex items-center",
          "text-sm font-medium text-gray-600 leading-tight"
        )}
        style={{ top: "0.5rem", right: "0.125rem" }}
      >
        {cycle}
        <span className={`text-${iconColor} ml-1`} title={title}>
          <StatusIcon className="h-4 w-auto stroke-2 stroke-current" />
        </span>
      </div>
    </div>
  );
};

export default BakingHistoryItem;

type StatsEntryProps = {
  name: string;
  value: React.ReactChild;
  valueComment?: React.ReactChild;
};

const StatsEntry: React.FC<StatsEntryProps> = ({
  name,
  value,
  valueComment,
}) => (
  <p className="text-gray-500 text-xs leading-tight my-1">
    <span className="mr-1">{name}:</span>
    <span className="text-gray-700">{value}</span>
    {valueComment && <span className="ml-1">{valueComment}</span>}
  </p>
);
