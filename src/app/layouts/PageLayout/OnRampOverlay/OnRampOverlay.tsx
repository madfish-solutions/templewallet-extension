import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { Anchor, Button } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as SmileWithDollarIcon } from 'app/icons/smile-with-dollar.svg';
import { ReactComponent as SmileWithGlassesIcon } from 'app/icons/smile-with-glasses.svg';
import { ReactComponent as SmileIcon } from 'app/icons/smile.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { useOnboardingProgress } from 'app/pages/Onboarding/hooks/useOnboardingProgress.hook';
import { dispatch } from 'app/store';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { useOnRampPossibilitySelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n/react';
import { useTezosAccountAddress } from 'temple/front';

import OnRampOverlayBgPopupImg from './assets/on-ramp-overlay-bg-popup.png';
import OnRampOverlayBgImg from './assets/on-ramp-overlay-bg.png';
import { OnRampOverlaySelectors } from './OnRampOverlay.selectors';
import { OnRampSmileButton } from './OnRampSmileButton/OnRampSmileButton';
import { getWertLink } from './utils/getWertLink.util';

export const OnRampOverlay: FC = () => {
  const publicKeyHash = useTezosAccountAddress();
  const { popup } = useAppEnv();
  const isOnRampPossibility = useOnRampPossibilitySelector();
  const { onboardingCompleted } = useOnboardingProgress();

  const popupClassName = useMemo(
    () => (popup ? 'inset-0 p-4' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2'),
    [popup]
  );
  const close = () => void dispatch(setOnRampPossibilityAction(false));

  if (!isOnRampPossibility || !onboardingCompleted || !publicKeyHash) return null;

  return (
    <>
      <div className="fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50"></div>
      <ContentContainer
        className={classNames('fixed z-50 overflow-y-auto', popupClassName)}
        style={{ maxWidth: '37.5rem', maxHeight: popup ? undefined : 'calc(100vh - 50px)' }}
        padding={false}
      >
        <div
          className={classNames(
            'flex flex-col text-center bg-white shadow-lg bg-no-repeat rounded-md p-6',
            popup && 'h-full'
          )}
          style={{
            backgroundImage: `url(${popup ? OnRampOverlayBgPopupImg : OnRampOverlayBgImg})`
          }}
        >
          <Button
            className={classNames(
              'w-24 h-9 uppercase bg-blue-500',
              'font-inter text-white',
              'text-sm font-medium rounded',
              'flex flex-row justify-center items-center self-end',
              'hover:opacity-90 relative'
            )}
            style={{ top: '-0.75rem', right: '-0.75rem' }}
            onClick={close}
            testID={OnRampOverlaySelectors.closeButton}
          >
            <T id="close" />
            <CloseIcon className="ml-2 h-4 w-auto stroke-current stroke-2" />
          </Button>
          <h1 className="font-inter font-normal text-gray-910 mt-25" style={{ fontSize: '1.438rem' }}>
            <T id="jumpInTezos" />
          </h1>
          <p
            className={classNames('font-inter font-normal text-gray-700 mt-4', !popup && 'px-10')}
            style={{ fontSize: '1.063rem' }}
          >
            <T
              id="onRampDesription"
              substitutions={[
                <span className="font-semibold">
                  <T id="creditCard" />
                </span>
              ]}
            />
          </p>
          <div className={classNames('flex flex-row justify-between mt-8', !popup && 'px-14')}>
            <OnRampSmileButton
              href={getWertLink(publicKeyHash, 50)}
              SmileIcon={SmileIcon}
              amount={50}
              onClick={close}
              testID={OnRampOverlaySelectors.fiftyDollarButton}
            />
            <OnRampSmileButton
              href={getWertLink(publicKeyHash, 100)}
              SmileIcon={SmileWithGlassesIcon}
              amount={100}
              className="hover:shadow hover:opacity-90 hover:bg-orange-500 bg-orange-500"
              titleClassName="text-primary-white"
              onClick={close}
              testID={OnRampOverlaySelectors.oneHundredDollarButton}
            />
            <OnRampSmileButton
              href={getWertLink(publicKeyHash, 200)}
              SmileIcon={SmileWithDollarIcon}
              amount={200}
              onClick={close}
              testID={OnRampOverlaySelectors.twoHundredDollarButton}
            />
          </div>
          <Anchor
            href={getWertLink(publicKeyHash)}
            className={classNames(
              'w-32',
              'mt-4 font-inter text-gray-600',
              'text-sm font-medium rounded',
              'flex flex-row justify-center items-center self-center',
              'hover:bg-gray-100 cursor-pointer'
            )}
            style={{ width: '9.438rem', height: '2.063rem' }}
            onClick={close}
            testID={OnRampOverlaySelectors.customAmountButton}
          >
            <T id="customAmount" />
            <ArrowRightIcon className="ml-2 h-3 w-auto stroke-current stroke-2" />
          </Anchor>
          <p
            className={classNames(
              'font-inter font-normal mt-auto px-5 text-xs text-gray-600',
              popup ? 'mt-29' : 'pt-29'
            )}
          >
            <T id="thirdParty" />
          </p>
        </div>
      </ContentContainer>
    </>
  );
};
