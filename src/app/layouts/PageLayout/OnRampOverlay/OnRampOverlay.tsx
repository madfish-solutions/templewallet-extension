import React, { FC } from 'react';

import classNames from 'clsx';

import { Anchor, Button } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';

import OnRampOverlayBgPopupImg from './assets/on-ramp-overlay-bg-popup.png';
import OnRampOverlayBgImg from './assets/on-ramp-overlay-bg.png';
import { OnRampOverlaySelectors } from './OnRampOverlay.selectors';
import { OnRampSmileButton } from './OnRampSmileButton/OnRampSmileButton';

export const OnRampOverlay: FC = () => {
  const { popup } = useAppEnv();
  //const { trackEvent } = useAnalytics();

  const popupClassName = popup ? 'inset-0 p-4' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2';

  return (
    <>
      <div className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}></div>
      <ContentContainer
        className={classNames('fixed z-50', 'overflow-y-auto', popupClassName)}
        style={{ maxWidth: '37.5rem' }}
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
            <OnRampSmileButton smile="🙂" amount={50} testID={OnRampOverlaySelectors.fiftyDollarButton} />
            <OnRampSmileButton
              smile="🤩"
              amount={100}
              className={classNames('hover:shadow hover:opacity-90 hover:bg-orange-500', 'bg-orange-500')}
              titleClassName="text-primary-white"
              testID={OnRampOverlaySelectors.oneHundredDollarButton}
            />
            <OnRampSmileButton smile="🤑" amount={200} testID={OnRampOverlaySelectors.twoHundredDollarButton} />
          </div>
          <Anchor
            className={classNames(
              'w-32',
              'mt-4 font-inter text-gray-600',
              'text-sm font-medium rounded',
              'flex flex-row justify-center items-center self-center',
              'hover:bg-gray-100 cursor-pointer'
            )}
            style={{ width: '9.438rem', height: '2.063rem' }}
          >
            <T id="customAmount" />
            <ArrowRightIcon className="ml-2 h-3 w-auto stroke-current stroke-2" />
          </Anchor>
          <p
            className={classNames(
              'font-inter font-normal mt-auto px-5',
              'text-xs text-gray-600',
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
