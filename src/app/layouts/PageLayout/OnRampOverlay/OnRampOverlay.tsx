import React, { memo, useCallback, useState } from 'react';

import classNames from 'clsx';
import browser from 'webextension-polyfill';

import { Button } from 'app/atoms';
import { OverlayCloseButton } from 'app/atoms/OverlayCloseButton';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';
import { ReactComponent as SmileWithDollarIcon } from 'app/icons/smile-with-dollar.svg';
import { ReactComponent as SmileWithGlassesIcon } from 'app/icons/smile-with-glasses.svg';
import { ReactComponent as SmileIcon } from 'app/icons/smile.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { useOnboardingProgress } from 'app/pages/Onboarding/hooks/useOnboardingProgress.hook';
import { dispatch } from 'app/store';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { useOnRampPossibilitySelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n/react';
import { useAccount } from 'lib/temple/front';

import OnRampOverlayBgPopupImg from './assets/on-ramp-overlay-bg-popup.png';
import OnRampOverlayBgImg from './assets/on-ramp-overlay-bg.png';
import { OnRampOverlaySelectors } from './OnRampOverlay.selectors';
import { OnRampSmileButton } from './OnRampSmileButton/OnRampSmileButton';
import { getWertLink } from './utils/getWertLink.util';

export const OnRampOverlay = memo(() => {
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const { publicKeyHash } = useAccount();
  const { popup } = useAppEnv();
  const isOnRampPossibility = useOnRampPossibilitySelector();
  const { onboardingCompleted } = useOnboardingProgress();

  const close = useCallback(() => dispatch(setOnRampPossibilityAction(false)), []);

  const handleRedirect = useCallback(
    async (amount?: number) => {
      try {
        setIsLinkLoading(true);

        const url = await getWertLink(publicKeyHash, amount);

        await browser.tabs.create({ url });
      } catch {
        // do nothing
      } finally {
        setIsLinkLoading(false);
        close();
      }
    },
    [close, publicKeyHash]
  );

  if (!isOnRampPossibility || !onboardingCompleted) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-700 bg-opacity-20">
      <ContentContainer
        className={classNames('overflow-y-scroll py-4', popup ? 'h-full px-4' : 'px-5')}
        padding={false}
      >
        <div
          className={classNames(
            'relative flex flex-col text-center bg-white shadow-lg bg-no-repeat rounded-md p-6',
            popup && 'h-full'
          )}
          style={{
            backgroundImage: `url(${popup ? OnRampOverlayBgPopupImg : OnRampOverlayBgImg})`,
            maxHeight: popup ? 'unset' : '34.25rem'
          }}
        >
          <OverlayCloseButton testID={OnRampOverlaySelectors.closeButton} onClick={close} />

          {isLinkLoading ? (
            <div className="flex justify-center my-60">
              <Spinner theme="gray" className="w-20" />
            </div>
          ) : (
            <>
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
                  SmileIcon={SmileIcon}
                  amount={50}
                  onClick={() => handleRedirect(50)}
                  testID={OnRampOverlaySelectors.fiftyDollarButton}
                />
                <OnRampSmileButton
                  SmileIcon={SmileWithGlassesIcon}
                  amount={100}
                  className="hover:shadow hover:opacity-90 hover:bg-orange-500 bg-orange-500"
                  titleClassName="text-primary-white"
                  onClick={() => handleRedirect(100)}
                  testID={OnRampOverlaySelectors.oneHundredDollarButton}
                />
                <OnRampSmileButton
                  SmileIcon={SmileWithDollarIcon}
                  amount={200}
                  onClick={() => handleRedirect(200)}
                  testID={OnRampOverlaySelectors.twoHundredDollarButton}
                />
              </div>

              <Button
                className={classNames(
                  'w-32',
                  'mt-4 font-inter text-gray-600',
                  'text-sm font-medium rounded',
                  'flex flex-row justify-center items-center self-center',
                  'hover:bg-gray-100 cursor-pointer'
                )}
                style={{ width: '9.438rem', height: '2.063rem' }}
                onClick={() => handleRedirect()}
                testID={OnRampOverlaySelectors.customAmountButton}
              >
                <T id="customAmount" />
                <ArrowRightIcon className="ml-2 h-3 w-auto stroke-current stroke-2" />
              </Button>

              <p
                className={classNames(
                  'font-inter font-normal mt-auto px-5 text-xs text-gray-600',
                  popup ? 'mt-29' : 'pt-29'
                )}
              >
                <T id="thirdParty" />
              </p>
            </>
          )}
        </div>
      </ContentContainer>
    </div>
  );
});
