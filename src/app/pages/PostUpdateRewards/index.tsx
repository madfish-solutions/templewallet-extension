import { FC, useState } from 'react';

import { ActionModal, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { ActionsButtonsBox, CloseButton, PageModal } from 'app/atoms/PageModal';
import { RewardsAnimation } from 'app/atoms/rewards-animation';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, setTestID, useAnalytics } from 'lib/analytics';
import { WEBSITES_ADS_ENABLED } from 'lib/constants';
import {
  activatePostUpdateRewardsPromo,
  getPostUpdateRewardsDaysRemaining,
  getPostUpdateRewardsEstimatedBonus
} from 'lib/post-update-rewards';
import { putToStorage } from 'lib/storage';

import { PostUpdateRewardsSelectors } from './selectors';

export const PostUpdateRewardsPage: FC = () => {
  const { trackEvent } = useAnalytics();
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [initialDate] = useState(() => new Date());

  const daysRemaining = getPostUpdateRewardsDaysRemaining(initialDate);
  const estimatedBonus = getPostUpdateRewardsEstimatedBonus(initialDate);

  const activate = async () => {
    if (isActivating) return;

    setIsActivating(true);
    dispatch(togglePartnersPromotionAction(true));
    try {
      await Promise.all([activatePostUpdateRewardsPromo(), putToStorage(WEBSITES_ADS_ENABLED, true)]);
      setCloseConfirmationOpen(false);
      setTimeout(() => toastSuccess('2x rewards activated'), 0);
      setTimeout(() => window.close(), 2500);
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
    window.close();
  };

  return (
    <>
      <PageModal
        title="Rewards"
        opened
        animated={false}
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
          <RewardsAnimation loop width={150} height={150} />

          <h2 className="text-font-h3 mt-1">Double your TKEY this month</h2>
          <p className="text-font-description text-grey-1 mt-1">
            Turn on promo content and earn <strong>2x TKEY</strong> on every reward until July 31.
          </p>

          <div className="w-full bg-grey-4 rounded-8 px-6 py-3 mt-5 flex items-center justify-between text-left">
            <div>
              <p className="text-font-description">Your estimated bonus</p>
              <p className="font-rubik text-2xl font-medium leading-9 text-primary">+{estimatedBonus} TKEY</p>
            </div>
            <p className="text-font-small text-grey-1">
              based on recent
              <br />
              top user activity
            </p>
          </div>

          <p className="text-font-description-bold mt-3">
            Ends July 31 - {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
          </p>
          <p className="text-font-small text-grey-1 mt-5 px-4">
            By activating 2x rewards you enable promo content and agree to share your wallet address and IP to receive
            tokens and promo ads.
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
            Activate 2x rewards
          </ActionModalButton>
        </ActionsButtonsBox>
      </PageModal>

      {closeConfirmationOpen && (
        <ActionModal title="This offer is one-time only" onClose={() => setCloseConfirmationOpen(false)}>
          <p className="px-4 pt-4 text-font-description text-grey-1 text-center">
            2x TKEY rewards can only be turned on from this screen, and it won't come back. Want to activate before you
            close?
          </p>
          <ActionModalButtonsContainer className="flex-col">
            <ActionModalButton
              color="primary"
              disabled={isActivating}
              onClick={handleConfirmationActivation}
              {...setTestID(PostUpdateRewardsSelectors.confirmationActivateButton)}
            >
              Activate 2x rewards
            </ActionModalButton>
            <ActionModalButton
              color="primary-low"
              disabled={isActivating}
              onClick={closeAnyway}
              {...setTestID(PostUpdateRewardsSelectors.confirmationCloseButton)}
            >
              Close anyway
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </ActionModal>
      )}
    </>
  );
};
