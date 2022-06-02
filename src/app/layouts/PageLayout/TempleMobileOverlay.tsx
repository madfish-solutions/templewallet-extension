import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { T, t } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';

import AddressBalanceImg from '../../pages/Onboarding/assets/address-balance.png';
import TempleMobileOverlayBgImg from './assets/temple-mobile-overlay-bg.png';
import TempleMobileOverlayDevicesImg from './assets/temple-mobile-overlay-devices.png';
import { useTempleMobile } from './hooks/useTempleMobile.hook';

export const TempleMobileOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const { showTempleMobileOverlay, setShowTempleMobileOverlay, setIsTempleMobileOverlaySkipped } = useTempleMobile();

  const handleSkipButtonClick = () => {
    setShowTempleMobileOverlay(false);
    setIsTempleMobileOverlaySkipped(true);
  };
  const handleDownloadButtonClick = () => {
    setShowTempleMobileOverlay(false);
    setIsTempleMobileOverlaySkipped(false);
  };
  console.log(showTempleMobileOverlay);
  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2';

  return ready && showTempleMobileOverlay ? (
    <>
      <div className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}></div>
      <ContentContainer
        className={classNames('fixed z-50', 'max-h-full', 'overflow-y-auto', popupClassName)}
        padding={!popup}
      >
        <div
          className={classNames('bg-white rounded-md shadow-lg py-8 px-15', popup && 'h-full')}
          style={{
            backgroundImage: `url(${TempleMobileOverlayBgImg})`
          }}
        >
          <Button
            className="w-full justify-center border-none"
            style={{
              padding: '10px 2rem',
              background: '#4198e0',
              color: '#ffffff',
              marginTop: '40px',
              borderRadius: 4
            }}
          >
            <T id="skip" />
          </Button>
          <img src={AddressBalanceImg} alt="AddressBalanceImg" />
          <p className="text-xl">
            <T id="templeIsOnMobile" />
          </p>
          <p className="text-sm">
            <T id="getTempleMobileAndroid" />
          </p>
          <Button
            className="w-full justify-center border-none"
            style={{
              padding: '10px 2rem',
              background: '#4198e0',
              color: '#ffffff',
              marginTop: '40px',
              borderRadius: 4
            }}
          >
            <T id="download" />
          </Button>
        </div>
      </ContentContainer>
    </>
  ) : null;
};
