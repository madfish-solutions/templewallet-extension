import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';

import { ActionModalButton } from 'app/atoms/action-modal';
import { DoneAnimation } from 'app/atoms/done-animation';
import { PageModal } from 'app/atoms/PageModal';
import { useAppEnv } from 'app/env';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY } from 'lib/constants';
import { t, T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { Lottie } from 'lib/ui/react-lottie';

import autoPayoutsImgSrc from './assets/auto-payouts.png';
import cashbackAnimation from './assets/cashback-animation.json';
import passiveEarnImgSrc from './assets/passive-earn.png';
import snapHandImgSrc from './assets/snap-hand.png';
import { ConfettiExplosion } from './ConfettiExplosion';
import { RewardsPushOverlaySelectors } from './selectors';

const cashbackAnimationOptions = {
  loop: false,
  autoplay: true,
  animationData: cashbackAnimation,
  rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
};

enum OverlayStep {
  Offer = 'Offer',
  Success = 'Success'
}

export const RewardsPushOverlay = memo(() => {
  const [shouldShow, setShouldShow] = useStorage(SHOULD_SHOW_REWARDS_PUSH_STORAGE_KEY, false);
  const adsAlreadyEnabled = useShouldShowPartnersPromoSelector();
  const { fullPage } = useAppEnv();
  const dispatch = useDispatch();
  const [step, setStep] = useState(OverlayStep.Offer);

  const { trackEvent } = useAnalytics();

  const close = useCallback(() => {
    trackEvent(RewardsPushOverlaySelectors.closeButton, AnalyticsEventCategory.ButtonPress);
    setShouldShow(false);
  }, [trackEvent, setShouldShow]);

  const handleActivateRewards = useCallback(() => {
    dispatch(togglePartnersPromotionAction(true));
    setStep(OverlayStep.Success);
  }, [dispatch]);

  const handleGotIt = useCallback(() => setShouldShow(false), [setShouldShow]);

  const opened = shouldShow && fullPage && (step === OverlayStep.Success || !adsAlreadyEnabled);

  return step === OverlayStep.Offer ? (
    <OfferModal opened={opened} onClose={close} onActivate={handleActivateRewards} />
  ) : (
    <SuccessModal opened={opened} onClose={close} onGotIt={handleGotIt} />
  );
});

interface OfferModalProps {
  opened: boolean;
  onClose: EmptyFn;
  onActivate: EmptyFn;
}

const OfferModal = memo<OfferModalProps>(({ opened, onClose, onActivate }) => {
  const actionsBoxProps = useMemo(
    () => ({
      children: (
        <ActionModalButton
          className="flex-1"
          color="primary"
          testID={RewardsPushOverlaySelectors.activateRewardsButton}
          onClick={onActivate}
        >
          <T id="activateRewards" />
        </ActionModalButton>
      )
    }),
    [onActivate]
  );

  return (
    <PageModal
      title={t('templeRewards')}
      opened={opened}
      onRequestClose={onClose}
      testID={RewardsPushOverlaySelectors.closeButton}
    >
      <PageModalScrollViewWithActions initialBottomEdgeVisible={false} actionsBoxProps={actionsBoxProps}>
        <div className="py-4 flex flex-col items-center text-center mb-3">
          <Lottie isClickToPauseDisabled options={cashbackAnimationOptions} height={138} width={138} />

          <h1 className="mt-4 mb-1 text-font-h3">
            <T id="rewardsPushHeading" />
          </h1>

          <p className="text-font-description text-grey-1 px-2">
            <T id="rewardsPushDescription" />
          </p>
        </div>

        <div className="flex flex-col gap-6 py-4 pl-3 pr-6 rounded-2xl border-0.5 border-lines">
          <FeatureCard
            imgSrc={snapHandImgSrc}
            title={t('rewardsPushZeroEfforts')}
            description={t('rewardsPushZeroEffortsDescription')}
          />
          <FeatureCard
            imgSrc={passiveEarnImgSrc}
            title={t('rewardsPushPassiveEarn')}
            description={t('rewardsPushPassiveEarnDescription')}
          />
          <FeatureCard
            imgSrc={autoPayoutsImgSrc}
            title={t('rewardsPushAutoPayouts')}
            description={t('rewardsPushAutoPayoutsDescription')}
          />
        </div>

        <p className="text-font-small text-grey-1 text-center m-4">
          <T id="rewardsPushDisclaimer" />
        </p>
      </PageModalScrollViewWithActions>
    </PageModal>
  );
});

interface SuccessModalProps {
  opened: boolean;
  onClose: EmptyFn;
  onGotIt: EmptyFn;
}

const SuccessModal = memo<SuccessModalProps>(({ opened, onClose, onGotIt }) => {
  const actionsBoxProps = useMemo(
    () => ({
      children: (
        <ActionModalButton
          className="flex-1"
          color="primary"
          testID={RewardsPushOverlaySelectors.gotItButton}
          onClick={onGotIt}
        >
          <T id="gotIt" />
        </ActionModalButton>
      )
    }),
    [onGotIt]
  );

  return (
    <PageModal
      title={t('templeRewards')}
      opened={opened}
      onRequestClose={onClose}
      testID={RewardsPushOverlaySelectors.closeButton}
    >
      <PageModalScrollViewWithActions actionsBoxProps={actionsBoxProps}>
        <div className="flex flex-col items-center text-center">
          <DoneAnimation overlay={<ConfettiExplosion />} />

          <h1 className="text-font-regular-bold mb-2">
            <T id="rewardsEarningActivated" />
          </h1>

          <p className="text-font-description text-grey-1">
            <T id="rewardsEarningActivatedDescription" />
          </p>
        </div>
      </PageModalScrollViewWithActions>
    </PageModal>
  );
});

interface FeatureCardProps {
  imgSrc: string;
  title: string;
  description: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ imgSrc, title, description }) => (
  <div className="flex items-center gap-3">
    <img src={imgSrc} alt="" className="h-10 w-10 shrink-0 object-contain" />
    <div className="flex flex-col gap-1">
      <span className="text-font-medium-bold">{title}</span>
      <span className="text-font-description text-grey-1">{description}</span>
    </div>
  </div>
);
