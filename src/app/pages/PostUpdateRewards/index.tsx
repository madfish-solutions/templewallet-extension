import { FC, useState } from 'react';

import { ActionModal, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { ActionsButtonsBox, CloseButton, PageModal } from 'app/atoms/PageModal';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';
import { WEBSITES_ADS_ENABLED } from 'lib/constants';
import { t, T } from 'lib/i18n';
import {
  activatePostUpdateRewardsPromo,
  getPostUpdateRewardsDaysRemaining,
  getPostUpdateRewardsEstimatedBonus
} from 'lib/post-update-rewards';
import { putToStorage } from 'lib/storage';

import rewards2xSrc from './assets/rewards2x.png';
import { PostUpdateRewardsSelectors } from './selectors';

interface DoubleRewardsEngagementModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
}

const ACTIVATION_TOAST_VISIBLE_DURATION = 1_500;

export const DoubleRewardsEngagementModal: FC<DoubleRewardsEngagementModalProps> = ({ opened, onRequestClose }) => {
  const { trackEvent } = useAnalytics();
  const [promoModalClosing, setPromoModalClosing] = useState(false);
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [initialDate] = useState(() => new Date());

  const daysRemaining = getPostUpdateRewardsDaysRemaining(initialDate);
  const estimatedBonus = getPostUpdateRewardsEstimatedBonus(initialDate);

  const closePromoModal = () => {
    setCloseConfirmationOpen(false);
    setPromoModalClosing(true);
    onRequestClose();
  };

  const activate = async () => {
    if (isActivating) return;

    setIsActivating(true);
    dispatch(togglePartnersPromotionAction(true));
    try {
      await Promise.all([activatePostUpdateRewardsPromo(), putToStorage(WEBSITES_ADS_ENABLED, true)]);
      setCloseConfirmationOpen(false);
      toastSuccess(t('postUpdateRewardsActivated'));
      setTimeout(closePromoModal, ACTIVATION_TOAST_VISIBLE_DURATION);
    } catch {
      setIsActivating(false);
    }
  };

  const handleConfirmationActivation = () => {
    trackEvent(
      PostUpdateRewardsSelectors.confirmationActivateButton,
      AnalyticsEventCategory.ButtonPress,
      undefined,
      true
    );
    void activate();
  };

  const handleAnnouncementActivation = () => {
    trackEvent(PostUpdateRewardsSelectors.ctaButton, AnalyticsEventCategory.ButtonPress, undefined, true);
    void activate();
  };

  const handleAnnouncementClose = () => {
    trackEvent(PostUpdateRewardsSelectors.closeButton, AnalyticsEventCategory.ButtonPress, undefined, true);
    setCloseConfirmationOpen(true);
  };

  const closeAnyway = () => {
    trackEvent(PostUpdateRewardsSelectors.confirmationCloseButton, AnalyticsEventCategory.ButtonPress, undefined, true);
    closePromoModal();
  };

  return (
    <>
      <PageModal
        title={t('rewards')}
        opened={opened}
        animated={promoModalClosing}
        onRequestClose={isActivating ? undefined : handleAnnouncementClose}
        titleRight={
          <CloseButton
            disabled={isActivating}
            onClick={handleAnnouncementClose}
            {...setTestID(PostUpdateRewardsSelectors.closeButton)}
          />
        }
      >
        <div className="flex-1 px-4 pt-6 pb-4 flex flex-col items-center text-center">
          <img src={rewards2xSrc} alt="" className="w-33 h-40 object-contain" />

          <h2 className="text-font-h3 mt-1">
            <T id="postUpdateRewardsHeadline" />
          </h2>
          <p className="text-font-description text-grey-1 mt-1">
            <T id="postUpdateRewardsDescription" />
          </p>

          <div className="w-full bg-grey-4 rounded-8 px-6 py-3 mt-5 flex items-center justify-between text-left">
            <div>
              <p className="text-font-description">
                <T id="postUpdateRewardsEstimatedBonus" />
              </p>
              <p className="font-rubik text-2xl font-medium leading-9 text-primary">
                {t('postUpdateRewardsBonusAmount', String(estimatedBonus))}
              </p>
            </div>
            <p className="text-font-small text-grey-1">
              <T id="postUpdateRewardsActivity" />
            </p>
          </div>

          <p className="text-font-description-bold mt-3">
            {t(daysRemaining === 1 ? 'postUpdateRewardsDayLeft' : 'postUpdateRewardsDaysLeft', String(daysRemaining))}
          </p>
          <p className="text-font-small text-grey-1 mt-5 px-4">
            <T id="postUpdateRewardsDisclaimer" />
          </p>
        </div>

        <ActionsButtonsBox>
          <ActionModalButton
            color="primary"
            className="w-full"
            disabled={isActivating}
            onClick={handleAnnouncementActivation}
            {...setTestID(PostUpdateRewardsSelectors.ctaButton)}
          >
            <T id="postUpdateRewardsActivate" />
          </ActionModalButton>
        </ActionsButtonsBox>
      </PageModal>

      {closeConfirmationOpen && (
        <ActionModal title={<T id="postUpdateRewardsOneTimeTitle" />} onClose={() => setCloseConfirmationOpen(false)}>
          <p className="px-4 pt-4 text-font-description text-grey-1 text-center">
            <T id="postUpdateRewardsOneTimeDescription" />
          </p>
          <ActionModalButtonsContainer className="flex-col">
            <ActionModalButton
              color="primary"
              disabled={isActivating}
              onClick={handleConfirmationActivation}
              {...setTestID(PostUpdateRewardsSelectors.confirmationActivateButton)}
            >
              <T id="postUpdateRewardsActivate" />
            </ActionModalButton>
            <ActionModalButton
              color="primary-low"
              disabled={isActivating}
              onClick={closeAnyway}
              {...setTestID(PostUpdateRewardsSelectors.confirmationCloseButton)}
            >
              <T id="postUpdateRewardsCloseAnyway" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </ActionModal>
      )}
    </>
  );
};
