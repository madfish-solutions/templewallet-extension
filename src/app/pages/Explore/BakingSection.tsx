import React, { memo, useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import { Button } from "app/atoms/Button";
import Spinner from "app/atoms/Spinner";
import { useAppEnv } from "app/env";
import { ReactComponent as DiamondIcon } from "app/icons/diamond.svg";
import { ReactComponent as SupportAltIcon } from "app/icons/support-alt.svg";
import BakingHistoryItem from "app/pages/Explore/BakingHistoryItem";
import BakerBanner from "app/templates/BakerBanner";
import { T, t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import {
  useAccount,
  useDelegate,
  TempleAccountType,
  useChainId,
  isKnownChainId,
} from "lib/temple/front";
import { getDelegatorRewards } from "lib/tzkt";
import useTippy from "lib/ui/useTippy";
import { Link } from "lib/woozie";

import styles from "./BakingSection.module.css";
import { BakingSectionSelectors } from "./BakingSection.selectors";

type RewardsPerEventHistoryItem = Partial<
  Record<
    | "rewardPerOwnBlock"
    | "rewardPerEndorsement"
    | "rewardPerFutureBlock"
    | "rewardPerFutureEndorsement",
    BigNumber
  >
>;
const allRewardsPerEventKeys: (keyof RewardsPerEventHistoryItem)[] = [
  "rewardPerOwnBlock",
  "rewardPerEndorsement",
  "rewardPerFutureBlock",
  "rewardPerFutureEndorsement",
];

const BakingSection = memo(() => {
  const acc = useAccount();
  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash);
  const canDelegate = acc.type !== TempleAccountType.WatchOnly;
  const chainId = useChainId(true);
  const { popup } = useAppEnv();

  const tippyProps = {
    trigger: "mouseenter",
    hideOnClick: false,
    content: t("disabledForWatchOnlyAccount"),
    animation: "shift-away-subtle",
  };

  const getBakingHistory = useCallback(
    async (_k: string, accountPkh: string) => {
      if (!isKnownChainId(chainId!)) {
        return [];
      }
      return (
        (await getDelegatorRewards(chainId, {
          address: accountPkh,
          limit: 30,
        })) || []
      );
    },
    [chainId]
  );
  const { data: bakingHistory, isValidating: loadingBakingHistory } =
    useRetryableSWR(
      ["baking-history", acc.publicKeyHash, myBakerPkh, chainId],
      getBakingHistory,
      { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
    );

  const delegateButtonRef = useTippy<HTMLButtonElement>(tippyProps);
  const commonDelegateButtonProps = useMemo(
    () => ({
      className: classNames(
        "py-2 px-6 rounded",
        "border-2",
        "border-indigo-500",
        canDelegate && "hover:border-indigo-600 focus:border-indigo-600",
        "bg-indigo-500",
        canDelegate && "hover:bg-indigo-600 focus:bg-indigo-600",
        "flex items-center justify-center",
        "text-white",
        "text-base font-semibold",
        "transition ease-in-out duration-300",
        canDelegate && styles["delegate-button"],
        !canDelegate && "opacity-50"
      ),
      testID: BakingSectionSelectors.DelegateNowButton,
      children: (
        <>
          <DiamondIcon
            className={classNames("-ml-2 mr-2", "h-5 w-auto", "stroke-current")}
          />
          <T id="delegateNow" />
        </>
      ),
    }),
    [canDelegate]
  );
  const commonSmallDelegateButtonProps = useMemo(
    () => ({
      className: classNames(
        "h-5 px-2 rounded flex items-center border",
        "border-indigo-500 text-indigo-500",
        canDelegate && "hover:border-indigo-600 focus:border-indigo-600",
        canDelegate && "hover:text-indigo-600 focus:text-indigo-600",
        "transition ease-in-out duration-300",
        !canDelegate && "opacity-50"
      ),
      testID: BakingSectionSelectors.ReDelegateButton,
      children: <T id="reDelegate" />,
    }),
    [canDelegate]
  );
  const rewardsPerEventHistory = useMemo(() => {
    if (!bakingHistory) {
      return [];
    }
    return bakingHistory.map((historyItem) => {
      const {
        endorsements,
        endorsementRewards,
        futureBlocks,
        futureBlockRewards,
        futureEndorsements,
        futureEndorsementRewards,
        ownBlocks,
        ownBlockRewards,
      } = historyItem;
      const rewardPerOwnBlock =
        ownBlocks === 0
          ? undefined
          : new BigNumber(ownBlockRewards).div(ownBlocks);
      const rewardPerEndorsement =
        endorsements === 0
          ? undefined
          : new BigNumber(endorsementRewards).div(endorsements);
      const rewardPerFutureBlock =
        futureBlocks === 0
          ? undefined
          : new BigNumber(futureBlockRewards).div(futureBlocks);
      const rewardPerFutureEndorsement =
        futureEndorsements === 0
          ? undefined
          : new BigNumber(futureEndorsementRewards).div(futureEndorsements);
      return {
        rewardPerOwnBlock,
        rewardPerEndorsement,
        rewardPerFutureBlock,
        rewardPerFutureEndorsement,
      };
    });
  }, [bakingHistory]);
  const fallbackRewardsPerEvents = useMemo(() => {
    return rewardsPerEventHistory.map((historyItem) =>
      allRewardsPerEventKeys.reduce(
        (fallbackRewardsItem, key, index) => {
          if (historyItem[key]) {
            return {
              ...fallbackRewardsItem,
              [key]: historyItem[key],
            };
          }
          let leftValueIndex = index - 1;
          while (
            leftValueIndex >= 0 &&
            !rewardsPerEventHistory[leftValueIndex][key]
          ) {
            leftValueIndex--;
          }
          let rightValueIndex = index + 1;
          while (
            rightValueIndex < rewardsPerEventHistory.length &&
            !rewardsPerEventHistory[rightValueIndex][key]
          ) {
            rightValueIndex++;
          }
          let fallbackRewardsValue = new BigNumber(0);
          const leftValueExists = leftValueIndex >= 0;
          const rightValueExists =
            rightValueIndex < rewardsPerEventHistory.length;
          if (leftValueExists && rightValueExists) {
            const leftValue = rewardsPerEventHistory[leftValueIndex][key]!;
            const rightValue = rewardsPerEventHistory[rightValueIndex][key]!;
            const x0 = leftValueIndex;
            const y0 = leftValue;
            const x1 = rightValueIndex;
            const y1 = rightValue;
            const x2 = index;
            const y2 = new BigNumber(x2 - x0)
              .div(x1 - x0)
              .multipliedBy(y1.minus(y0))
              .plus(y0);
            fallbackRewardsValue = y2;
          } else if (leftValueExists || rightValueExists) {
            fallbackRewardsValue =
              rewardsPerEventHistory[
                leftValueExists ? leftValueIndex : rightValueIndex
              ][key]!;
          }
          return {
            ...fallbackRewardsItem,
            [key]: fallbackRewardsValue,
          };
        },
        {
          rewardPerOwnBlock: new BigNumber(0),
          rewardPerEndorsement: new BigNumber(0),
          rewardPerFutureBlock: new BigNumber(0),
          rewardPerFutureEndorsement: new BigNumber(0),
        }
      )
    );
  }, [rewardsPerEventHistory]);
  const currentCycle = useMemo(
    () =>
      bakingHistory?.find(
        ({
          extraBlockRewards,
          endorsementRewards,
          ownBlockRewards,
          ownBlockFees,
          extraBlockFees,
        }) => {
          const totalCurrentRewards = new BigNumber(extraBlockRewards)
            .plus(endorsementRewards)
            .plus(ownBlockRewards)
            .plus(ownBlockFees)
            .plus(extraBlockFees);
          return totalCurrentRewards.gt(0);
        }
      )?.cycle,
    [bakingHistory]
  );

  return useMemo(
    () => (
      <div className="flex justify-center">
        <div
          className="mb-12 flex flex-col items-stretch"
          style={{ maxWidth: "22.5rem" }}
        >
          {myBakerPkh ? (
            <>
              <div className="mb-4 flex flex-row justify-between items-center text-xs leading-tight">
                <span className="text-gray-600">
                  <T id="delegatedTo" />
                </span>

                {canDelegate ? (
                  <Link
                    to="/delegate"
                    type="button"
                    {...commonSmallDelegateButtonProps}
                  />
                ) : (
                  <Button
                    ref={delegateButtonRef}
                    {...commonSmallDelegateButtonProps}
                  />
                )}
              </div>
              <BakerBanner
                bakerPkh={myBakerPkh}
                style={{
                  maxWidth: undefined,
                  width: popup ? "100%" : "22.5rem",
                }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <SupportAltIcon className="w-16 h-auto mb-1 stroke-current" />

              <T id="delegatingMotivation">
                {(message) => (
                  <p
                    className="mb-6 text-sm font-light text-center"
                    style={{ maxWidth: "20rem" }}
                  >
                    {message}
                  </p>
                )}
              </T>

              {canDelegate ? (
                <Link
                  to="/delegate"
                  type="button"
                  {...commonDelegateButtonProps}
                />
              ) : (
                <Button
                  ref={delegateButtonRef}
                  {...commonDelegateButtonProps}
                />
              )}
            </div>
          )}
          {loadingBakingHistory && (
            <div className="flex flex-row justify-center items-center h-10 mt-4">
              <Spinner theme="gray" className="w-16" />
            </div>
          )}
          {/* {bakingHistory?.length === 0 && (
            <div className="flex flex-row justify-center mt-4">
              <h3 className="text-sm font-light text-center max-w-xs">
                Baking history is empty
              </h3>
            </div>
          )} */}
          {bakingHistory && bakingHistory.length > 0 && (
            <>
              <p className="text-gray-600 leading-tight mt-4">History:</p>
              {bakingHistory.map((historyItem, index) => (
                <BakingHistoryItem
                  currentCycle={currentCycle}
                  key={`${historyItem.cycle},${historyItem.baker.address}`}
                  content={historyItem}
                  fallbackRewardPerEndorsement={
                    fallbackRewardsPerEvents[index].rewardPerEndorsement
                  }
                  fallbackRewardPerFutureBlock={
                    fallbackRewardsPerEvents[index].rewardPerFutureBlock
                  }
                  fallbackRewardPerFutureEndorsement={
                    fallbackRewardsPerEvents[index].rewardPerFutureEndorsement
                  }
                  fallbackRewardPerOwnBlock={
                    fallbackRewardsPerEvents[index].rewardPerOwnBlock
                  }
                />
              ))}
            </>
          )}
        </div>
      </div>
    ),
    [
      currentCycle,
      myBakerPkh,
      canDelegate,
      commonDelegateButtonProps,
      commonSmallDelegateButtonProps,
      delegateButtonRef,
      loadingBakingHistory,
      bakingHistory,
      fallbackRewardsPerEvents,
      popup,
    ]
  );
});

export default BakingSection;
