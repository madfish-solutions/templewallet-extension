import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { openInFullPage, useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';

import TempleMobileOverlayBgImg from './assets/temple-mobile-overlay-bg.png';
import TempleMobileOverlayDevicesImg from './assets/temple-mobile-overlay-devices.png';
import { useTempleMobile } from './hooks/useTempleMobile.hook';

export const TempleMobileOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const { showTempleMobileOverlay, setShowTempleMobileOverlay, setIsTempleMobileOverlaySkipped } = useTempleMobile();

  const handleSkipButtonClick = () => {
    openInFullPage();
    //setShowTempleMobileOverlay(false);
    //setIsTempleMobileOverlaySkipped(true);
  };
  const handleDownloadButtonClick = () => {
    openInFullPage();
    //setShowTempleMobileOverlay(false);
    //setIsTempleMobileOverlaySkipped(false);
  };
  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2';

  return ready && showTempleMobileOverlay ? (
    <>
      <div className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}></div>
      <ContentContainer
        className={classNames('fixed z-50', 'max-h-full', 'overflow-y-auto', popupClassName)}
        padding={!popup}
      >
        <div
          className={classNames('flex flex-col bg-white rounded-md shadow-lg', popup && 'h-full')}
          style={{
            backgroundImage: `url(${TempleMobileOverlayBgImg})`
          }}
        >
          <Button
            onClick={handleSkipButtonClick}
            className="font-inter font-normal text-sm text-gray-600 self-end mt-3 mr-6"
            style={{
              maxWidth: 'max-content'
            }}
          >
            <T id="skip" />
          </Button>
          <img
            src={TempleMobileOverlayDevicesImg}
            alt="TempleMobileOverlayDevicesImg"
            style={{
              width: 250,
              height: 359
            }}
          />
          <p className="text-xl">
            <T id="templeIsOnMobile" />
          </p>
          <p className="text-sm">
            <T id="getTempleMobileAndroid" />
          </p>
          <Button
            className="mb-8 py-2 px-4 bg-primary-orange text-white"
            onClick={handleDownloadButtonClick}
            style={{
              maxWidth: '7rem'
            }}
          >
            <T id="download" />
          </Button>
        </div>
      </ContentContainer>
    </>
  ) : null;
};
