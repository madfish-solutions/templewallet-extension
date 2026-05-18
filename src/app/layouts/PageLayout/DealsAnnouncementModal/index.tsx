import { useEffect, useState } from 'react';

import clsx from 'clsx';
import { useDispatch } from 'react-redux';

import { DoneAnimation } from 'app/atoms/done-animation';
import { ActionsButtonsBox, CloseButton } from 'app/atoms/PageModal';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { StyledButton } from 'app/atoms/StyledButton';
import { setMerchantPromotionEnabledAction } from 'app/store/merchant-promotion/actions';
import { useMerchantPromotionEnabledSelector } from 'app/store/merchant-promotion/selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { DEALS_ANNOUNCEMENT_SHOWN_STORAGE_KEY } from 'lib/constants';
import { T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { navigate } from 'lib/woozie';
import { getAccountAddressForChain } from 'temple/accounts';
import { useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import merchantsImgSrc from './assets/merchants.png';
import { DealsAnnouncementSelectors } from './selectors';

enum OverlayStep {
  Offer = 'Offer',
  Success = 'Success'
}

export const DealsAnnouncementModal = () => {
  const [shown, setShown] = useStorage<boolean | null>(DEALS_ANNOUNCEMENT_SHOWN_STORAGE_KEY);
  const [explicitlyClosed, setExplicitlyClosed] = useState(false);
  const [step, setStep] = useState<OverlayStep>(OverlayStep.Offer);
  const dispatch = useDispatch();
  const account = useAccount();
  const dealsEnabled = useMerchantPromotionEnabledSelector();
  const { trackEvent } = useAnalytics();

  // Snapshot the eligibility decision once SWR settles. After that, neither `shown` flipping
  // (from our own write) nor `dealsEnabled` flipping (from our own Activate dispatch) closes
  // the modal — visibility is locked to the user's explicit dismissal.
  const [wasEligibleAtMount, setWasEligibleAtMount] = useState<boolean | undefined>(undefined);
  if (wasEligibleAtMount === undefined && shown !== undefined) {
    setWasEligibleAtMount(shown !== true && !dealsEnabled);
  }

  const opened = wasEligibleAtMount === true && !explicitlyClosed;

  useEffect(() => {
    if (!opened) return;
    void setShown(true);
    trackEvent(DealsAnnouncementSelectors.inWalletView, AnalyticsEventCategory.PageOpened);
  }, [opened, setShown, trackEvent]);

  const handleClose = () => setExplicitlyClosed(true);

  const handleActivate = () => {
    dispatch(setMerchantPromotionEnabledAction(true));

    const accountPkh = getAccountAddressForChain(account, TempleChainKind.Tezos) ?? '';
    trackEvent('DealsEnabled', AnalyticsEventCategory.General, { accountPkh }, true);

    setStep(OverlayStep.Success);
  };

  const handleGotIt = () => {
    setExplicitlyClosed(true);
    navigate('/rewards');
  };

  if (!opened) return null;

  return (
    <MiniPageModal opened onRequestClose={handleClose} showHeader={false}>
      <div className="w-full h-full bg-white">
        <div className="flex justify-end px-3 pt-3 pb-1">
          <CloseButton onClick={handleClose} testID={DealsAnnouncementSelectors.inWalletClose} />
        </div>

        {step === OverlayStep.Offer ? <OfferBody /> : <SuccessBody />}
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        {step === OverlayStep.Offer ? (
          <StyledButton
            size="L"
            color="primary"
            className={clsx('w-full')}
            onClick={handleActivate}
            testID={DealsAnnouncementSelectors.inWalletActivate}
          >
            <T id="activateCashback" />
          </StyledButton>
        ) : (
          <StyledButton size="L" color="primary" className={clsx('w-full')} onClick={handleGotIt}>
            <T id="gotIt" />
          </StyledButton>
        )}
      </ActionsButtonsBox>
    </MiniPageModal>
  );
};

const OfferBody = () => (
  <div className={clsx('flex flex-col p-4 rounded-t-8 bg-background min-h-65.5')}>
    <img src={merchantsImgSrc} alt="" className={clsx('w-45 h-24.5 mx-auto object-contain mb-4')} />

    <p className={clsx('text-font-regular-bold text-center mb-1')}>
      <T id="featureUnlockedCashback" />
    </p>

    <p className={clsx('text-font-description text-grey-1 text-center')}>
      <T id="cashbackInWalletPitch" />
    </p>

    <p className={clsx('text-font-small text-grey-1 text-center mt-4')}>
      <T id="cashbackParticipationDisclaimer" />
    </p>
  </div>
);

const SuccessBody = () => (
  <div className={clsx('flex flex-col items-center text-center p-4 rounded-t-8 bg-background min-h-65.5')}>
    <DoneAnimation withBackground={false} animationSize={100} className="mb-8 mt-4" />

    <h1 className={clsx('text-font-regular-bold mb-2')}>
      <T id="cashbackActivated" />
    </h1>

    <p className={clsx('text-font-description text-grey-1')}>
      <T id="cashbackActivatedBrowseHint" />
    </p>
  </div>
);
