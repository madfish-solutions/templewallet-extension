import React, { memo, useMemo } from 'react';

import { ActionModalButton } from 'app/atoms/action-modal';
import { FireAnimatedEmoji } from 'app/atoms/fire-animated-emoji';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { EvmNetworksLogos } from 'app/atoms/NetworksLogos';
import { PageModal } from 'app/atoms/PageModal';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { t, T } from 'lib/i18n';
import { ETHERLINK_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { Lottie } from 'lib/ui/react-lottie';
import { toPercentage } from 'lib/ui/utils';

import { makeAnimationOptions } from '../utils';

import rewardsAnimation from './rewards-animation.json';
import { RewardsCoverCard } from './rewards-cover-card';

interface RewardsModalProps {
  isOpen: boolean;
  onRequestClose: EmptyFn;
  onActionClick: EmptyFn;
}

const REWARDS_ANIMATION_OPTIONS = makeAnimationOptions(rewardsAnimation);

const rewardsCoverCardsProps = [
  {
    networkLogo: <TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} />,
    networkName: 'Tezos',
    costs: '0.11',
    rewardsCover: (
      <>
        <span>{toPercentage('1.72', undefined, Number.NaN)}</span>
        <div className="p-1">
          <FireAnimatedEmoji />
        </div>
      </>
    ),
    annotation: (
      <div className="p-2 bg-grey-4 rounded-lg px-1 py-2">
        <p className="text-font-small text-grey-1 text-center">
          <T id="tezosFeesAnnotation" />
        </p>
      </div>
    )
  },
  {
    networkLogo: <EvmNetworkLogo chainId={ETHERLINK_MAINNET_CHAIN_ID} />,
    networkName: 'Etherlink',
    costs: '0.76',
    rewardsCover: toPercentage('0.25', undefined, Number.NaN)
  },
  {
    networkLogo: <EvmNetworksLogos />,
    networkName: t('otherEvmNetworks'),
    costs: '27.60',
    rewardsCover: '0.2-3%'
  }
];

export const RewardsModal = memo<RewardsModalProps>(({ isOpen, onRequestClose, onActionClick }) => {
  const actionsBoxProps = useMemo(
    () => ({
      children: (
        <ActionModalButton
          className="flex-1"
          color="primary"
          testID={HomeSelectors.coverMyCostsButton}
          onClick={onActionClick}
        >
          <T id="coverMyCosts" />
        </ActionModalButton>
      )
    }),
    [onActionClick]
  );

  return (
    <PageModal title={<T id="templeRewards" />} opened={isOpen} onRequestClose={onRequestClose}>
      <PageModalScrollViewWithActions initialBottomEdgeVisible={false} actionsBoxProps={actionsBoxProps}>
        <div className="py-4 flex flex-col items-center text-center">
          <Lottie options={REWARDS_ANIMATION_OPTIONS} height={120} width={120} />
          <h1 className="mt-4 mb-1 text-font-h3">
            <T id="coverNetworkCosts" />
          </h1>
          <p className="text-font-description text-grey-1">
            <T id="coverNetworkCostsDescription" />
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {rewardsCoverCardsProps.map(({ networkName, ...restProps }) => (
            <RewardsCoverCard key={networkName} networkName={networkName} {...restProps} />
          ))}
        </div>
        <p className="text-font-small text-center text-grey-1 mt-5 mb-4">
          <T id="enablePromoContentResults" />
        </p>
      </PageModalScrollViewWithActions>
    </PageModal>
  );
});
