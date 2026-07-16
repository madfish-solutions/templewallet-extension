import { FC, useState } from 'react';

import { useDispatch } from 'react-redux';

import DocBg from 'app/a11y/DocBg';
import { Button, IconBase } from 'app/atoms';
import { ActionModal, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { RewardsAnimation } from 'app/atoms/rewards-animation';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { FULL_PAGE_WRAP_CLASSNAME, LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
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
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const [initialDate] = useState(() => new Date());

  const daysRemaining = getPostUpdateRewardsDaysRemaining(initialDate);
  const estimatedBonus = getPostUpdateRewardsEstimatedBonus(initialDate);

  const activate = async () => {
    dispatch(togglePartnersPromotionAction(true));
    await Promise.all([activatePostUpdateRewardsPromo(), putToStorage(WEBSITES_ADS_ENABLED, true)]);
    window.close();
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
      <DocBg bgClassName="bg-secondary-low" />
      <div className={FULL_PAGE_WRAP_CLASSNAME}>
        <main
          className={`${LAYOUT_CONTAINER_CLASSNAME} min-h-[600px] bg-background rounded-6 shadow-bottom overflow-hidden flex flex-col`}
        >
          <header className="h-14 shrink-0 bg-white border-b-0.5 border-lines flex items-center justify-center relative px-4">
            <h1 className="text-font-regular-bold">Rewards</h1>
            <Button
              className="absolute right-4 text-grey-2"
              onClick={handleAnnouncementClose}
              {...setTestID(PostUpdateRewardsSelectors.closeButton)}
            >
              <IconBase Icon={CloseIcon} />
            </Button>
          </header>

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

          <div className="bg-white shadow-top px-4 pt-4 pb-6">
            <ActionModalButton
              color="primary"
              className="w-full"
              onClick={handleAnnouncementActivation}
              {...setTestID(PostUpdateRewardsSelectors.ctaButton)}
            >
              Activate 2x rewards
            </ActionModalButton>
          </div>
        </main>
      </div>

      {closeConfirmationOpen && (
        <ActionModal title="This offer is one-time only" onClose={() => setCloseConfirmationOpen(false)}>
          <p className="px-4 pt-4 text-font-description text-grey-1 text-center">
            2x TKEY rewards can only be turned on from this screen, and it won't come back. Want to activate before you
            close?
          </p>
          <ActionModalButtonsContainer className="flex-col">
            <ActionModalButton
              color="primary"
              onClick={handleConfirmationActivation}
              {...setTestID(PostUpdateRewardsSelectors.confirmationActivateButton)}
            >
              Activate 2x rewards
            </ActionModalButton>
            <ActionModalButton
              color="primary-low"
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
