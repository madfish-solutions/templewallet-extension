import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';
import { useTempleClient, useStorage } from 'lib/temple/front';

import { changelogData, ChangelogItem } from './ChangelogOverlay.data';
import { ChangelogOverlaySelectors } from './ChangelogOverlay.selectors';

const currentVersion = process.env.VERSION;

export const ChangelogOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const [lastShownVersion, setLastShownVersion] = useStorage<string | undefined | null>(
    `last_shown_changelog_version`,
    '1.14.8'
  );

  const handleContinue = () => {
    setLastShownVersion(currentVersion);
  };
  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 p-12';

  const isNewerVersion = changelogData.find(e => e.version === currentVersion);
  if (!isNewerVersion) {
    return null;
  }
  const filteredChangelog = filterByVersion(lastShownVersion, changelogData);

  return ready && lastShownVersion !== currentVersion ? (
    <>
      <div className={'fixed left-0 right-0 top-0 bottom-0 opacity-20 bg-gray-700 z-50'}></div>
      <ContentContainer
        className={classNames('fixed z-50', 'max-h-full', 'overflow-y-auto', popupClassName)}
        padding={!popup}
      >
        <div
          className={classNames('bg-white shadow-lg relative', popup ? 'pt-20 pb-16 px-8' : 'rounded-md py-32')}
          style={{
            backgroundColor: `#FFF2E6`,
            minHeight: popup ? '100%' : 'unset'
          }}
        >
          <Button
            onClick={handleContinue}
            className={classNames(
              'font-inter font-normal text-sm text-gray-600',
              'self-end mt-3 mr-6 absolute top-0 right-0',
              popup ? '' : 'pr-2'
            )}
            testID={ChangelogOverlaySelectors.Skip}
            style={{
              maxWidth: 'max-content'
            }}
          >
            <T id="skip" />
          </Button>
          <div className="flex flex-col max-w-sm mx-auto w-full">
            <p className="text-xl font-inter font-semibold" style={{ fontSize: 23, color: '#ED8936' }}>
              <T id="changelogTitle" />
            </p>
            {filteredChangelog.map(({ version, data }) => (
              <React.Fragment key={version}>
                <p className="mb-10 mt-2 font-inter" style={{ fontSize: 16 }}>
                  <T id="update" /> {version}
                </p>
                <ul>
                  {data.map((value, index) => (
                    <li className="mb-1" style={{ listStyleType: 'disc' }} key={index}>
                      {value}
                    </li>
                  ))}
                </ul>
              </React.Fragment>
            ))}
            <Button
              className="mt-6 py-2 px-8 text-white font-inter rounded font-semibold uppercase mx-auto"
              onClick={handleContinue}
              testID={ChangelogOverlaySelectors.Continue}
              style={{
                fontSize: 13,
                maxWidth: '7rem',
                backgroundColor: '#ED8936'
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

const filterByVersion = (version: string | null | undefined, data: Array<ChangelogItem>): Array<ChangelogItem> => {
  let foundVersion: number | undefined;
  return data.filter((x, i) => {
    if (x.version === version) {
      foundVersion = i;
    }
    return foundVersion ? foundVersion > i : true;
  });
};
