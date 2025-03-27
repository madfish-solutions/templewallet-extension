import React, { memo } from 'react';

import classNames from 'clsx';

import { Anchor } from 'app/atoms';
import { OverlayCloseButton } from 'app/atoms/OverlayCloseButton';
import { ReactComponent as OpenExternalIcon } from 'app/icons/open-external.svg';
import { ReactComponent as ApplePayIcon } from 'app/icons/payment-options/apple-pay.svg';
import { ReactComponent as MastercardIcon } from 'app/icons/payment-options/mastercard.svg';
import { ReactComponent as VisaIcon } from 'app/icons/payment-options/visa.svg';
import { ReactComponent as SmileWithDollarIcon } from 'app/icons/smile-with-dollar.svg';
import { ReactComponent as SmileWithGlassesIcon } from 'app/icons/smile-with-glasses.svg';
import { ReactComponent as SmileIcon } from 'app/icons/smile.svg';
import { useOnboardingProgress } from 'app/pages/Onboarding/hooks/useOnboardingProgress.hook';
import { dispatch } from 'app/store';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { useOnRampPossibilitySelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n/react';
import { useAccountAddressForTezos } from 'temple/front';

import { OnRampOverlaySelectors } from './OnRampOverlay.selectors';
import { OnRampSmileButton } from './OnRampSmileButton/OnRampSmileButton';
import { getWertLink } from './utils/getWertLink.util';

export const OnRampOverlay = memo(() => {
  const publicKeyHash = useAccountAddressForTezos();
  const isOnRampPossibility = useOnRampPossibilitySelector();
  const { onboardingCompleted } = useOnboardingProgress();

  const close = () => void dispatch(setOnRampPossibilityAction(false));

  if (!isOnRampPossibility || !onboardingCompleted || !publicKeyHash) return null;

  return (
    <div className="fixed inset-0 z-overlay-promo flex flex-col items-center justify-center bg-black bg-opacity-10 backdrop-blur-[2px]">
      <div className="w-[352px] mx-auto relative flex flex-col text-center bg-white shadow-lg bg-no-repeat rounded-md p-4">
        <OverlayCloseButton testID={OnRampOverlaySelectors.closeButton} onClick={close} />

        <h1 className="text-base font-semibold text-text my-1">
          <T id="insufficientTezBalance" />
        </h1>

        <p className="text-sm text-grey-1 mb-1">
          <T id="topupTezosBalance" />
        </p>

        <div className="flex flex-row items-center my-4 gap-x-2">
          <OnRampSmileButton
            href={publicKeyHash ? getWertLink(publicKeyHash, 50) : '#'}
            SmileIcon={SmileIcon}
            amount={50}
            onClick={close}
            testID={OnRampOverlaySelectors.fiftyDollarButton}
          />
          <OnRampSmileButton
            href={publicKeyHash ? getWertLink(publicKeyHash, 100) : '#'}
            SmileIcon={SmileWithGlassesIcon}
            amount={100}
            accentColors
            onClick={close}
            testID={OnRampOverlaySelectors.oneHundredDollarButton}
          />
          <OnRampSmileButton
            href={publicKeyHash ? getWertLink(publicKeyHash, 200) : '#'}
            SmileIcon={SmileWithDollarIcon}
            amount={200}
            onClick={close}
            testID={OnRampOverlaySelectors.twoHundredDollarButton}
          />
        </div>

        <Anchor
          href={publicKeyHash ? getWertLink(publicKeyHash, 200) : '#'}
          className={classNames(
            'my-0.5 font-inter text-secondary',
            'text-xs font-semibold',
            'flex items-center',
            'hover:secondary-hover cursor-pointer self-center'
          )}
          onClick={close}
          testID={OnRampOverlaySelectors.customAmountButton}
        >
          <T id="customAmount" />
          <OpenExternalIcon className="h-4 w-4 ml-0.5" />
        </Anchor>

        <p className={'text-xxxs mt-3 mb-2 text-grey-1'}>
          <T id="thirdParty" />
        </p>

        <div className="mb-1 gap-x-2 flex items-center self-center">
          <VisaIcon />
          <MastercardIcon />
          <ApplePayIcon />
        </div>
      </div>
    </div>
  );
});
