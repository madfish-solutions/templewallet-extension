import React, { FC, memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { DelegateButton, RedelegateButton } from 'app/atoms/BakingButtons';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import BakingHistoryItem from 'app/pages/Home/OtherComponents/BakingSection/HistoryItem';
import { BakerBanner } from 'app/templates/BakerBanner';
import { getDelegatorRewards, isKnownChainId } from 'lib/apis/tzkt';
import { T } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { useAccount, useChainId, useDelegate } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';

import { NotBakingBanner } from './NotBakingBanner';
import { BakingSectionSelectors } from './selectors';
import { reduceFunction, RewardsPerEventHistoryItem } from './utils';

const BakingSection = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;
  const chainId = useChainId(true);

  const { popup } = useAppEnv();

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const getBakingHistory = useCallback(
    async ([, accountPkh, , chainId]: [string, string, string | nullish, string | nullish]) => {
      if (!isKnownChainId(chainId!)) {
        return [];
      }
      return (
        (await getDelegatorRewards(chainId, {
          address: accountPkh,
          limit: 30
        })) || []
      );
    },
    []
  );

  const { data: bakingHistory, isValidating: loadingBakingHistory } = useRetryableSWR(
    ['baking-history', acc.publicKeyHash, myBakerPkh, chainId],
    getBakingHistory,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const rewardsPerEventHistory = useMemo(() => {
    if (!bakingHistory) {
      return [];
    }

    return bakingHistory.map(historyItem => {
      const {
        endorsements,
        endorsementRewards,
        futureBlocks,
        futureBlockRewards,
        futureEndorsements,
        futureEndorsementRewards,
        ownBlocks,
        ownBlockRewards
      } = historyItem;
      const rewardPerOwnBlock = ownBlocks === 0 ? undefined : new BigNumber(ownBlockRewards).div(ownBlocks);
      const rewardPerEndorsement = endorsements === 0 ? undefined : new BigNumber(endorsementRewards).div(endorsements);
      const rewardPerFutureBlock = futureBlocks === 0 ? undefined : new BigNumber(futureBlockRewards).div(futureBlocks);
      const rewardPerFutureEndorsement =
        futureEndorsements === 0 ? undefined : new BigNumber(futureEndorsementRewards).div(futureEndorsements);
      return {
        rewardPerOwnBlock,
        rewardPerEndorsement,
        rewardPerFutureBlock,
        rewardPerFutureEndorsement
      };
    });
  }, [bakingHistory]);

  const fallbackRewardsPerEvents = useMemo(() => {
    return rewardsPerEventHistory.map(historyItem =>
      ALL_REWARDS_PER_EVENT_KEYS.reduce(
        (fallbackRewardsItem, key, index) => {
          return reduceFunction(fallbackRewardsItem, key, index, historyItem, rewardsPerEventHistory);
        },
        {
          rewardPerOwnBlock: new BigNumber(0),
          rewardPerEndorsement: new BigNumber(0),
          rewardPerFutureBlock: new BigNumber(0),
          rewardPerFutureEndorsement: new BigNumber(0)
        }
      )
    );
  }, [rewardsPerEventHistory]);

  const currentCycle = useMemo(
    () =>
      bakingHistory?.find(
        ({ extraBlockRewards, endorsementRewards, ownBlockRewards, ownBlockFees, extraBlockFees }) => {
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

  const BakerBannerHeaderRight = useCallback<FC>(
    () => <RedelegateButton disabled={cannotDelegate} testID={BakingSectionSelectors.reDelegateButton} />,
    [cannotDelegate]
  );

  const StakeOrManageButton = useCallback<FC<{ staked: number }>>(
    ({ staked }) => (
      <DelegateButton
        to={`/staking?tab=${staked ? 'my-stake' : 'new-stake'}`}
        thinner
        flashing={!staked}
        disabled={cannotDelegate}
      >
        {staked ? (
          <T id="manage" />
        ) : (
          <span>
            <T id="stake" /> {TEZOS_METADATA.symbol}
          </span>
        )}
      </DelegateButton>
    ),
    [cannotDelegate]
  );

  const noPreviousHistory = bakingHistory ? bakingHistory.length === 0 : false;

  return (
    <div className={clsx('pt-4 pb-12 flex flex-col max-w-sm mx-auto', popup && 'px-5')}>
      {myBakerPkh ? (
        <BakerBanner bakerPkh={myBakerPkh} HeaderRight={BakerBannerHeaderRight} ActionButton={StakeOrManageButton} />
      ) : (
        <NotBakingBanner noPreviousHistory={noPreviousHistory} cannotDelegate={cannotDelegate} />
      )}

      {loadingBakingHistory && (
        <div className="flex justify-center items-center h-10 mt-6">
          <Spinner theme="gray" className="w-16" />
        </div>
      )}

      {bakingHistory && bakingHistory.length > 0 && (
        <>
          <h4 className="mt-8 text-base leading-tight font-medium text-blue-750">Rewards:</h4>

          {bakingHistory.map((historyItem, index) => (
            <BakingHistoryItem
              currentCycle={currentCycle}
              key={`${historyItem.cycle},${historyItem.baker.address}`}
              content={historyItem}
              fallbackRewardPerEndorsement={fallbackRewardsPerEvents[index].rewardPerEndorsement}
              fallbackRewardPerFutureBlock={fallbackRewardsPerEvents[index].rewardPerFutureBlock}
              fallbackRewardPerFutureEndorsement={fallbackRewardsPerEvents[index].rewardPerFutureEndorsement}
              fallbackRewardPerOwnBlock={fallbackRewardsPerEvents[index].rewardPerOwnBlock}
            />
          ))}
        </>
      )}
    </div>
  );
});

export default BakingSection;

const ALL_REWARDS_PER_EVENT_KEYS: (keyof RewardsPerEventHistoryItem)[] = [
  'rewardPerOwnBlock',
  'rewardPerEndorsement',
  'rewardPerFutureBlock',
  'rewardPerFutureEndorsement'
];
