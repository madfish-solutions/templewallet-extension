import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';

import { AnalyticsEventCategory, useAnalytics } from '../../../lib/analytics';
import TempleMobileOverlayBgImg from './assets/temple-mobile-overlay-bg.png';
import TempleMobileOverlayDevicesImg from './assets/temple-mobile-overlay-devices.png';
import { useTempleMobile } from './hooks/useTempleMobile.hook';
import { TempleMobileSelectors } from './TempleMobile.selectors';

export const TempleMobileOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const { trackEvent } = useAnalytics();
  const { showTempleMobileOverlay, setShowTempleMobileOverlay, setIsTempleMobileOverlaySkipped } = useTempleMobile();

  const handleSkip = () => {
    trackEvent(TempleMobileSelectors.Skip, AnalyticsEventCategory.ButtonPress);
    setShowTempleMobileOverlay(false);
    setIsTempleMobileOverlaySkipped(true);
  };
  const handleDownload = () => {
    trackEvent(TempleMobileSelectors.Download, AnalyticsEventCategory.ButtonPress);
    setShowTempleMobileOverlay(false);
    setIsTempleMobileOverlaySkipped(false);
    window.open('https://templewallet.com/download', '_blank');
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
          className={classNames('flex flex-col text-center bg-white shadow-lg', popup ? 'h-full' : 'rounded-md')}
          style={{
            backgroundImage: `url(${TempleMobileOverlayBgImg})`
          }}
        >
          <Button
            onClick={handleSkip}
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
            className={classNames('mx-auto', popup && 'mt-5')}
            style={{
              maxWidth: 250,
              maxHeight: 359
            }}
          />
          <p className="text-xl mt-6 font-inter font-semibold" style={{ fontSize: 28, color: '#FF5B00' }}>
            <T id="templeIsOnMobile" />
          </p>
          <p className="mb-3 font-normal font-inter" style={{ fontSize: 12 }}>
            <T id="getTempleMobileAndroid" />
          </p>
          <Button
            className="mb-8 py-2 px-4 text-white font-inter rounded font-semibold uppercase mx-auto"
            onClick={handleDownload}
            style={{
              fontSize: 13,
              maxWidth: '7rem',
              backgroundColor: '#FF5B00'
            }}
          >
            <T id="download" />
          </Button>
        </div>
      </ContentContainer>
    </>
  ) : null;
};
