import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';
import { useStorage, useTempleClient } from 'lib/temple/front';

import { AnalyticsEventCategory, useAnalytics } from '../../../lib/analytics';
import YupanaLogo from './assets/yupana-logo.png';
import YupanaOverlayBg from './assets/yupana-overlay-bg.png';
import { YupanaOverlaySelectors } from './YupanaOverlay.selectors';

const YUPANA_LINK = 'https://app.yupana.finance';

export const YupanaOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const { trackEvent } = useAnalytics();
  const [showYupanaOverlay, setShowYupanaOverlay] = useStorage('show_yupana_overlay', true);

  const handleSkip = () => {
    trackEvent(YupanaOverlaySelectors.Skip, AnalyticsEventCategory.ButtonPress);
    setShowYupanaOverlay(false);
  };
  const handleCheckNow = () => {
    trackEvent(YupanaOverlaySelectors.CheckNow, AnalyticsEventCategory.ButtonPress);
    setShowYupanaOverlay(false);
  };
  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2';

  return ready && showYupanaOverlay ? (
    <>
      <div className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}></div>
      <ContentContainer
        className={classNames('fixed z-50', 'max-h-full', 'overflow-y-auto', popupClassName)}
        padding={!popup}
      >
        <div style={{ backgroundColor: '#041D3B' }}>
          <div
            className={classNames('flex flex-col text-center bg-white shadow-lg', popup ? 'h-full' : 'rounded-md')}
            style={{
              backgroundImage: `url(${YupanaOverlayBg})`,
              backgroundSize: '608px 271px'
            }}
          >
            <Button
              onClick={handleSkip}
              className={classNames(
                'font-inter font-normal text-sm text-white self-end mt-3 mr-6',
                popup ? 'mb-4' : 'mb-2'
              )}
              style={{
                maxWidth: 'max-content'
              }}
            >
              <T id="skip" />
            </Button>

            <div className="flex row justify-center items-center">
              <img
                src={YupanaLogo}
                alt="YupanaLogo"
                className={classNames('pr-3')}
                style={{
                  maxWidth: popup ? 110 : 160,
                  maxHeight: popup ? 35 : 53.5
                }}
              />
              <span
                className="text-left font-inter font-normal border-white pl-3 text-white"
                style={{ fontSize: popup ? 13 : 16, borderLeftWidth: 1, maxWidth: popup ? 150 : 175 }}
              >
                <T id="theLendingProtocol" />
              </span>
            </div>

            <div className="text-center font-inter mt-6 mb-5">
              <p className="font-bold" style={{ fontSize: popup ? 28 : 32, color: '#00E0FF' }}>
                <T id="alreadyLaunched" />
              </p>
              <p
                className="font-semibold mx-auto mt-2"
                style={{ fontSize: popup ? 14 : 16, color: '#00E0FF', maxWidth: 247 }}
              >
                <T id="borrowLandEarn" />
              </p>
              <p className="font-semibold text-white mt-5" style={{ fontSize: popup ? 10 : 12 }}>
                <T id="tokensAreSupported" />
              </p>
            </div>

            <a
              href={YUPANA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={classNames(
                'py-2 text-sm font-inter rounded font-extrabold uppercase mx-auto',
                popup ? 'px-5' : 'px-10'
              )}
              onClick={handleCheckNow}
              style={{
                marginBottom: 30,
                backgroundColor: '#00CDEE',
                color: '#0B1524'
              }}
            >
              <T id="checkNow" />
            </a>
          </div>

          <div style={{ height: 12, backgroundColor: '#0057B7' }}></div>
          <div style={{ height: 12, backgroundColor: '#FFD700' }}></div>

          <div className={classNames('text-white text-center font-inter mt-5', popup ? 'pb-12' : 'pb-10')}>
            <p className="text-lg mx-auto font-semibold" style={{ maxWidth: popup ? 268 : 384 }}>
              <T
                id="zeroSwapCommissionTitle"
                substitutions={[
                  <span style={{ color: '#FFDC1D' }}>
                    <T id="independenceDayOfUkraine" />
                  </span>
                ]}
              />
            </p>
            <p
              className="mt-6 mx-auto font-normal"
              style={{ fontSize: 12, opacity: 0.83, maxWidth: popup ? 280 : 370 }}
            >
              <T
                id="zeroSwapCommissionDescription"
                substitutions={[
                  <span className="font-semibold">24.08</span>,
                  <span className="font-semibold">07.09</span>,
                  <span className="font-semibold">
                    <T id="swap" />
                  </span>
                ]}
              />
            </p>
          </div>
        </div>
      </ContentContainer>
    </>
  ) : null;
};
