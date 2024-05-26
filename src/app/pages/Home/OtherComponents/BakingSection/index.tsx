import React, { FC, memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Divider, Money } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import BakingHistoryItem from 'app/pages/Home/OtherComponents/BakingSection/HistoryItem';
import { BakerCard, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { getDelegatorRewards, isKnownChainId } from 'lib/apis/tzkt';
import { T } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { useAccount, useChainId, useDelegate, useTezos } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';

import { DelegateButton, RedelegateButton } from './DelegateButton';
import { NotBakingBanner } from './NotBakingBanner';
import { reduceFunction, RewardsPerEventHistoryItem } from './utils';

const BakingSection = memo(() => {
  const acc = useAccount();
  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;
  const chainId = useChainId(true);
  const tezos = useTezos();

  const { popup } = useAppEnv();

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

  const { data: stakedData } = useRetryableSWR(
    ['delegate-stake', 'get-staked', tezos.checksum],
    () => tezos.rpc.getStakedBalance(acc.publicKeyHash),
    {
      suspense: true
    }
  );

  const stakedAmount = stakedData && stakedData.gt(0) ? atomsToTokens(stakedData, TEZOS_METADATA.decimals) : null;

  console.log('STAKED DATA:', stakedData?.toString());

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
    () => <RedelegateButton disabled={cannotDelegate} />,
    [cannotDelegate]
  );

  const noPreviousHistory = bakingHistory ? bakingHistory.length === 0 : false;

  return (
    <div className={clsx('pt-4 pb-12 flex flex-col max-w-sm mx-auto', popup && 'px-5')}>
      {myBakerPkh ? (
        <div className={clsx(BAKER_BANNER_CLASSNAME, 'flex flex-col gap-y-4')}>
          <BakerCard displayAddress bakerPkh={myBakerPkh} HeaderRight={BakerBannerHeaderRight} />

          <Divider />

          {stakedAmount && (
            <div className="text-sm text-blue-750">
              <span className="mr-1">Staked:</span>
              <span className="font-semibold">
                <Money smallFractionFont={false} cryptoDecimals={TEZOS_METADATA.decimals}>
                  {stakedAmount}
                </Money>{' '}
                {TEZOS_METADATA.symbol}
              </span>
            </div>
          )}

          <DelegateButton thinner disabled={cannotDelegate}>
            {stakedAmount ? (
              <T id="manage" />
            ) : (
              <span>
                <T id="stake" /> {TEZOS_METADATA.symbol}
              </span>
            )}
          </DelegateButton>
        </div>
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
