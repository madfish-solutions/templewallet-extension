import React, { memo, useCallback, useEffect } from 'react';

// import BigNumber from 'bignumber.js';

// import Spinner from 'app/atoms/Spinner/Spinner';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
// import BakingHistoryItem from 'app/pages/Home/OtherComponents/BakingSection/HistoryItem';
// import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import { getDelegatorRewards, isKnownChainId } from 'lib/apis/tzkt';
import { useRetryableSWR } from 'lib/swr';
import { useDelegate } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useAccountForTezos, useTezosChainByChainId } from 'temple/front';

import { BakerBannerWithStake } from './BakerBannerWithStake';
import { NotBakingBanner } from './NotBakingBanner';
// import { reduceFunction, RewardsPerEventHistoryItem } from './utils';

interface Props {
  tezosChainId: string;
  onBakerPresent: SyncFn<boolean>;
}

const BakingSection = memo<Props>(({ tezosChainId, onBakerPresent }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const account = useAccountForTezos();

  if (!network || !account) throw new DeadEndBoundaryError();

  const accountPkh = account.address;
  const { chainId } = network;
  const cannotDelegate = account.type === TempleAccountType.WatchOnly;

  const { data: myBakerPkh } = useDelegate(accountPkh, network, true, false);

  useEffect(() => void onBakerPresent(myBakerPkh !== null), [myBakerPkh, onBakerPresent]);

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

  const { data: bakingHistory /*, isValidating: loadingBakingHistory */ } = useRetryableSWR(
    ['baking-history', accountPkh, myBakerPkh, chainId],
    getBakingHistory,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  /* const rewardsPerEventHistory = useMemo(() => {
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
  ); */

  const noPreviousHistory = bakingHistory ? bakingHistory.length === 0 : false;

  return (
    <>
      {myBakerPkh ? (
        <BakerBannerWithStake
          network={network}
          accountPkh={accountPkh}
          bakerPkh={myBakerPkh}
          cannotDelegate={cannotDelegate}
        />
      ) : (
        <NotBakingBanner noPreviousHistory={noPreviousHistory} cannotDelegate={cannotDelegate} />
      )}
    </>
  );
});

export default BakingSection;

/* const ALL_REWARDS_PER_EVENT_KEYS: (keyof RewardsPerEventHistoryItem)[] = [
  'rewardPerOwnBlock',
  'rewardPerEndorsement',
  'rewardPerFutureBlock',
  'rewardPerFutureEndorsement'
]; */
