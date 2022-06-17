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

const changes = [
  { Component: () => <>Swap router upgrade: added Vortex DEX pools and QuipuSwap token-token pools.</> },
  { Component: () => <>Added Ithaca Smartpy RPC and Jakarta support</> },
  { Component: () => <>Exolix top-up support improvements, single swap limit increased to $10k</> },
  { Component: () => <>Copy Error Text button: a feature to make error reports easier.</> },
  { Component: () => <strong>Groundwork done for Temple desktop and Temple mobile sync.</strong> },
  { Component: () => <>Other security and UI improvements!</> }
];

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
          className={classNames('bg-white shadow-lg', popup ? 'h-full' : 'rounded-md')}
          style={{
            backgroundColor: `#FFF2E6`
          }}
        >
          <div className="flex flex-col max-w-sm mx-auto w-full py-32">
            <p className="text-xl font-inter font-semibold" style={{ fontSize: 23, color: '#FF5B00' }}>
              <T id="changelogTitle">
                {message => (
                  <>
                    {message} {VERSION}
                  </>
                )}
              </T>
            </p>
            <p className="my-4 font-semibold font-inter" style={{ fontSize: 14 }}>
              <T id="changelogDescription" />
            </p>
            <ul>
              {changes.map((value, index) => (
                <li className="mb-1" style={{ listStyleType: 'disc', listStylePosition: 'inside' }} key={index}>
                  <value.Component />
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 py-2 px-8 text-white font-inter rounded font-semibold uppercase mx-auto"
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
        </div>
      </ContentContainer>
    </>
  ) : null;
};
