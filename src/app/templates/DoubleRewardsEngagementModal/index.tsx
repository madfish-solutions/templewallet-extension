import { FC, useState } from 'react';

import { ActionModal, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { CloseButton, PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { removeToast, toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { WEBSITES_ADS_ENABLED } from 'lib/constants';
import { t, T } from 'lib/i18n';
import {
  activatePostUpdateRewardsPromo,
  getPostUpdateRewardsDaysRemaining,
  getPostUpdateRewardsEstimatedBonus
} from 'lib/post-update-rewards';
import { putToStorage } from 'lib/storage';

import rewards2xSrc from './assets/rewards2x.png';
import { DoubleRewardsEngagementModalSelectors } from './selectors';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

const ACTIVATION_TOAST_VISIBLE_DURATION = 2_000;

export const DoubleRewardsEngagementModal: FC<Props> = ({ opened, onRequestClose }) => {
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
      const toastId = toastSuccess(t('postUpdateRewardsActivated'));
      setTimeout(() => {
        removeToast(toastId);
        closePromoModal();
      }, ACTIVATION_TOAST_VISIBLE_DURATION);
    } catch {
      setIsActivating(false);
    }
  };

  const handleConfirmationActivation = () => {
    trackEvent(
      DoubleRewardsEngagementModalSelectors.confirmationActivateButton,
      AnalyticsEventCategory.ButtonPress,
      undefined,
      true
    );
    void activate();
  };

  const handleAnnouncementActivation = () => {
    trackEvent(DoubleRewardsEngagementModalSelectors.ctaButton, AnalyticsEventCategory.ButtonPress, undefined, true);
    void activate();
  };

  const handleAnnouncementClose = () => {
    trackEvent(DoubleRewardsEngagementModalSelectors.closeButton, AnalyticsEventCategory.ButtonPress, undefined, true);
    setCloseConfirmationOpen(true);
  };

  const closeAnyway = () => {
    trackEvent(
      DoubleRewardsEngagementModalSelectors.confirmationCloseButton,
      AnalyticsEventCategory.ButtonPress,
      undefined,
      true
    );
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
            testID={DoubleRewardsEngagementModalSelectors.closeButton}
          />
        }
      >
        <PageModalScrollViewWithActions
          actionsBoxProps={{
            children: (
              <StyledButton
                size="L"
                color="primary"
                className="w-full"
                disabled={isActivating}
                onClick={handleAnnouncementActivation}
                testID={DoubleRewardsEngagementModalSelectors.ctaButton}
              >
                <T id="postUpdateRewardsActivate" />
              </StyledButton>
            )
          }}
        >
          <div className="flex flex-col items-center text-center pb-4">
            <img src={rewards2xSrc} alt="" className="mt-8 mb-4 w-33 h-40 object-contain" />

            <h3 className="text-font-h3">
              <T id="postUpdateRewardsHeadline" />
            </h3>
            <p className="text-font-description text-grey-1 mt-1">
              <T
                id="postUpdateRewardsDescription"
                substitutions={
                  <span className="font-bold">
                    <T id="postUpdateRewardsMultiplier" />
                  </span>
                }
              />
            </p>

            <div className="w-full bg-grey-4 rounded-8 px-6 py-3 mt-7 flex items-center justify-between text-left">
              <div>
                <p className="text-font-description">
                  <T id="postUpdateRewardsEstimatedBonus" />
                </p>
                <p className="text-font-num-bold-24 text-primary">
                  <T id="postUpdateRewardsBonusAmount" substitutions={estimatedBonus} />
                </p>
              </div>
              <p className="text-font-small text-grey-1">
                <T id="postUpdateRewardsActivity" />
              </p>
            </div>

            <p className="text-font-description-bold mt-3">
              <T
                id={daysRemaining === 1 ? 'postUpdateRewardsDayLeft' : 'postUpdateRewardsDaysLeft'}
                substitutions={daysRemaining}
              />
            </p>
            <p className="text-font-small text-grey-1 mt-5 px-4">
              <T id="postUpdateRewardsDisclaimer" />
            </p>
          </div>
        </PageModalScrollViewWithActions>
      </PageModal>

      {closeConfirmationOpen && (
        <ActionModal title={t('postUpdateRewardsOneTimeTitle')} onClose={() => setCloseConfirmationOpen(false)}>
          <p className="px-4 pt-4 text-font-description text-grey-1 text-center">
            <T id="postUpdateRewardsOneTimeDescription" />
          </p>
          <ActionModalButtonsContainer className="flex-col">
            <ActionModalButton
              color="primary"
              disabled={isActivating}
              onClick={handleConfirmationActivation}
              testID={DoubleRewardsEngagementModalSelectors.confirmationActivateButton}
            >
              <T id="postUpdateRewardsActivate" />
            </ActionModalButton>
            <ActionModalButton
              color="primary-low"
              disabled={isActivating}
              onClick={closeAnyway}
              testID={DoubleRewardsEngagementModalSelectors.confirmationCloseButton}
            >
              <T id="postUpdateRewardsCloseAnyway" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </ActionModal>
      )}
    </>
  );
};
