import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';
import { useTempleClient, useStorage } from 'lib/temple/front';

import { AnalyticsEventCategory, useAnalytics } from '../../../../lib/analytics';
import { ChangelogOverlaySelectors } from './ChangelogOverlay.selectors';

export const VERSION = '1.14.5';

export const ChangelogOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const { trackEvent } = useAnalytics();
  const [showChangelogOverlay, toggleChangelogOverlay] = useStorage(`changelog_${VERSION}`, true);

  const handleContinue = () => {
    trackEvent(ChangelogOverlaySelectors.Continue, AnalyticsEventCategory.ButtonPress);
    toggleChangelogOverlay(false);
  };
  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2';

  return ready && showChangelogOverlay ? (
    <>
      <div className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}></div>
      <ContentContainer
        className={classNames('fixed z-50', 'max-h-full', 'overflow-y-auto', popupClassName)}
        padding={!popup}
      >
        <div
          className={classNames('flex flex-col text-center bg-white shadow-lg', popup ? 'h-full' : 'rounded-md')}
          style={{
            backgroundColor: `#FFF2E6`
          }}
        >
          <p className="text-xl mt-6 font-inter font-semibold" style={{ fontSize: 28, color: '#FF5B00' }}>
            <T id="changelogTitle">
              {message => (
                <>
                  {message} {VERSION}
                </>
              )}
            </T>
          </p>
          <p className="mb-3 font-normal font-inter" style={{ fontSize: 12 }}>
            <T id="getTempleMobileAndroid" />
          </p>
          <Button
            className="mb-8 py-2 px-4 text-white font-inter rounded font-semibold uppercase mx-auto"
            onClick={handleContinue}
            style={{
              fontSize: 13,
              maxWidth: '7rem',
              backgroundColor: '#FF5B00'
            }}
          >
            <T id="okGotIt" />
          </Button>
        </div>
      </ContentContainer>
    </>
  ) : null;
};
