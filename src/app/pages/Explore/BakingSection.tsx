import React, { memo, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Collapse } from 'react-collapse';

import { Button } from 'app/atoms/Button';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as DelegateIcon } from 'app/icons/delegate.svg';
import { ReactComponent as DiscordIcon } from 'app/icons/delegationDis.svg';
import { ReactComponent as RedditIcon } from 'app/icons/delegationRed.svg';
import { ReactComponent as TelegramIcon } from 'app/icons/delegationTg.svg';
import { ReactComponent as TwitterIcon } from 'app/icons/delegationTwi.svg';
import { ReactComponent as YoutubeIcon } from 'app/icons/delegationYt.svg';
import BakingHistoryItem from 'app/pages/Explore/BakingHistoryItem';
import BakerBanner from 'app/templates/BakerBanner';
import { T, t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import { useAccount, useDelegate, TempleAccountType, useChainId, isKnownChainId, useNetwork } from 'lib/temple/front';
import { getDelegatorRewards, TZKT_API_BASE_URLS } from 'lib/tzkt';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import styles from './BakingSection.module.css';
import { BakingSectionSelectors } from './BakingSection.selectors';

type RewardsPerEventHistoryItem = Partial<
  Record<
    'rewardPerOwnBlock' | 'rewardPerEndorsement' | 'rewardPerFutureBlock' | 'rewardPerFutureEndorsement',
    BigNumber
  >
>;
const allRewardsPerEventKeys: (keyof RewardsPerEventHistoryItem)[] = [
  'rewardPerOwnBlock',
  'rewardPerEndorsement',
  'rewardPerFutureBlock',
  'rewardPerFutureEndorsement'
];

const links = [
  {
    href: 'https://t.me/MadFishCommunity',
    Icon: TelegramIcon
  },
  {
    href: 'https://www.madfish.solutions/discord',
    Icon: DiscordIcon
  },
  {
    href: 'https://twitter.com/madfishofficial',
    Icon: TwitterIcon
  },
  {
    href: 'https://www.youtube.com/channel/UCUp80EXfJEigks3xU5hiwyA',
    Icon: YoutubeIcon
  },
  {
    href: 'https://www.reddit.com/r/MadFishCommunity',
    Icon: RedditIcon
  }
];

const BakingSection = memo(() => {
  const acc = useAccount();
  const network = useNetwork();
  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash);
  const canDelegate = acc.type !== TempleAccountType.WatchOnly;
  const chainId = useChainId(true);
  const [showDetails, setShowDetails] = useState(false);

  const toggleShowDetails = useCallback(() => setShowDetails(prevValue => !prevValue), []);

  const tippyProps = {
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('disabledForWatchOnlyAccount'),
    animation: 'shift-away-subtle'
  };

  const getBakingHistory = useCallback(
    async (_k: string, accountPkh: string) => {
      if (!isKnownChainId(chainId!) || !TZKT_API_BASE_URLS.has(chainId)) {
        return [];
      }
      return (
        (await getDelegatorRewards(chainId, {
          address: accountPkh,
          limit: 30
        })) || []
      );
    },
    [chainId]
  );
  const { data: bakingHistory, isValidating: loadingBakingHistory } = useRetryableSWR(
    ['baking-history', acc.publicKeyHash, myBakerPkh, chainId],
    getBakingHistory,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const delegateButtonRef = useTippy<HTMLButtonElement>(tippyProps);
  const commonDelegateButtonProps = useMemo(
    () => ({
      className: classNames(
        'py-2 px-6 rounded',
        'border-2',
        'border-blue-500',
        canDelegate && 'hover:border-blue-600 focus:border-blue-600',
        'bg-blue-500',
        canDelegate && 'hover:bg-blue-600 focus:bg-blue-600',
        'flex items-center justify-center',
        'text-white',
        'text-sm font-normal',
        'transition ease-in-out duration-300',
        canDelegate && styles['delegate-button'],
        !canDelegate && 'opacity-50',
        'w-full'
      ),
      testID: BakingSectionSelectors.DelegateNowButton,
      children: <T id="delegate" />
    }),
    [canDelegate]
  );
  const commonSmallDelegateButtonProps = useMemo(
    () => ({
      className: classNames(
        'h-5 px-2 rounded flex items-center border',
        'border-indigo-500 text-indigo-500',
        canDelegate && 'hover:border-indigo-600 focus:border-indigo-600',
        canDelegate && 'hover:text-indigo-600 focus:text-indigo-600',
        'transition ease-in-out duration-300',
        !canDelegate && 'opacity-50'
      ),
      testID: BakingSectionSelectors.ReDelegateButton,
      children: <T id="reDelegate" />
    }),
    [canDelegate]
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
      allRewardsPerEventKeys.reduce(
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

  return useMemo(
    () => (
      <div className="flex justify-center">
        <div className="mb-12 flex flex-col items-stretch" style={{ maxWidth: '22.5rem' }}>
          {myBakerPkh ? (
            <>
              <div className="mb-4 flex flex-row justify-between items-center text-xs leading-tight">
                <span className="text-gray-600">
                  <T id="delegatedTo" />
                </span>

                <DelegateLink
                  canDelegate={canDelegate}
                  delegateButtonRef={delegateButtonRef}
                  delegateButtonProps={commonSmallDelegateButtonProps}
                />
              </div>
              <BakerBanner displayAddress bakerPkh={myBakerPkh} />
            </>
          ) : (
            <div className="flex flex-col items-center text-black">
              <DelegateIcon className="mb-1 stroke-current" />

              {network.type === 'dcp' ? (
                <T id="dcpDelegatingMotivation">
                  {message => (
                    <p className="mb-6 text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
                      {message}
                    </p>
                  )}
                </T>
              ) : (
                <>
                  <T id="delegationWelcome">
                    {message => <h3 className="mb-2 text-lg font-normal text-center w-full">{message}</h3>}
                  </T>

                  <div className={classNames('relative px-4 py-2', styles['sectionBg'])}>
                    <p className={'text-sm font-normal w-full cursor-pointer'} onClick={toggleShowDetails}>
                      <T id={'delegationHowTo'} />
                    </p>
                    <button
                      className={classNames(
                        'absolute flex items-center justify-center w-4 h-4 rounded',
                        'text-orange-500 transform transition-transform duration-500',
                        showDetails && 'rotate-180'
                      )}
                      style={{ right: '8px', top: '8px' }}
                      onClick={toggleShowDetails}
                    >
                      <ChevronDownIcon className="w-4 h-4 stroke-1 stroke-current" />
                    </button>

                    <Collapse
                      theme={{ collapse: styles.ReactCollapse }}
                      isOpened={showDetails}
                      initialStyle={{ height: '0px', overflow: 'hidden' }}
                    >
                      <p className={'text-xs mb-2 font-normal w-full mt-2'}>
                        <T id={'delegationFaq1'} />
                      </p>
                      <p className={'text-xs mb-2 font-normal w-full'}>
                        <T id={'delegationFaq2'} />
                      </p>
                      <p className={'text-xs mb-2 font-normal w-full'}>
                        <T id={'delegationFaq3'} />
                      </p>
                      <p className={'text-xs mb-2 font-normal w-full'}>
                        <T id={'delegationFaq4'} />
                      </p>
                    </Collapse>
                  </div>

                  <p className={'text-xs mb-4 font-normal mt-6'}>
                    <T id={'delegationGuide'} />
                    <a
                      className="ml-1 text-blue-500 underline"
                      href="https://www.youtube.com/watch?v=iFH8WEfuaDI"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <T id={'delegationGuideLink'} />
                    </a>
                  </p>

                  <div className="flex items-center gap-6 mb-2">
                    {links.map(({ href, Icon }) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                        <Icon className="h-full w-auto" />
                      </a>
                    ))}
                  </div>

                  <p className={'text-xs mb-6 font-normal w-full'}>
                    <T id={'delegationComunity'} />
                  </p>
                </>
              )}
              <DelegateLink
                canDelegate={canDelegate}
                delegateButtonRef={delegateButtonRef}
                delegateButtonProps={commonDelegateButtonProps}
              />
            </div>
          )}
          {loadingBakingHistory && (
            <div className="flex flex-row justify-center items-center h-10 mt-4">
              <Spinner theme="gray" className="w-16" />
            </div>
          )}
          {bakingHistory && bakingHistory.length > 0 && (
            <>
              <p className="text-gray-600 leading-tight mt-4">History:</p>
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
      showDetails,
      toggleShowDetails,
      network.type
    ]
  );
});

export default BakingSection;

interface DelegateLinkProps {
  canDelegate: boolean;
  delegateButtonRef: React.RefObject<HTMLButtonElement>;
  delegateButtonProps: {
    className: string;
    testID: BakingSectionSelectors;
    children: JSX.Element;
  };
}

const DelegateLink: React.FC<DelegateLinkProps> = ({ canDelegate, delegateButtonRef, delegateButtonProps }) =>
  canDelegate ? (
    <Link to="/delegate" type="button" {...delegateButtonProps} />
  ) : (
    <Button ref={delegateButtonRef} {...delegateButtonProps} />
  );

type RewardsTrueType = {
  rewardPerOwnBlock: BigNumber;
  rewardPerEndorsement: BigNumber;
  rewardPerFutureBlock: BigNumber;
  rewardPerFutureEndorsement: BigNumber;
};

const reduceFunction = (
  fallbackRewardsItem: RewardsTrueType,
  key: keyof RewardsPerEventHistoryItem,
  index: number,
  historyItem: RewardsPerEventHistoryItem,
  rewardsPerEventHistory: RewardsPerEventHistoryItem[]
) => {
  if (historyItem[key]) {
    return {
      ...fallbackRewardsItem,
      [key]: historyItem[key]
    };
  }
  let leftValueIndex = index - 1;
  while (leftValueIndex >= 0 && !rewardsPerEventHistory[leftValueIndex][key]) {
    leftValueIndex--;
  }
  let rightValueIndex = index + 1;
  while (rightValueIndex < rewardsPerEventHistory.length && !rewardsPerEventHistory[rightValueIndex][key]) {
    rightValueIndex++;
  }
  let fallbackRewardsValue = new BigNumber(0);
  const leftValueExists = leftValueIndex >= 0;
  const rightValueExists = rightValueIndex < rewardsPerEventHistory.length;
  if (leftValueExists && rightValueExists) {
    const leftValue = rewardsPerEventHistory[leftValueIndex][key]!;
    const rightValue = rewardsPerEventHistory[rightValueIndex][key]!;
    const x0 = leftValueIndex;
    const y0 = leftValue;
    const x1 = rightValueIndex;
    const y1 = rightValue;
    fallbackRewardsValue = new BigNumber(index - x0)
      .div(x1 - x0)
      .multipliedBy(y1.minus(y0))
      .plus(y0);
  } else if (leftValueExists || rightValueExists) {
    fallbackRewardsValue = rewardsPerEventHistory[leftValueExists ? leftValueIndex : rightValueIndex][key]!;
  }
  return {
    ...fallbackRewardsItem,
    [key]: fallbackRewardsValue
  };
};
