import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { useAppEnv } from 'app/env';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { APP_VERSION } from 'lib/env';
import { T } from 'lib/i18n';
import { useTempleClient, useStorage } from 'lib/temple/front';

import { changelogData, ChangelogItem } from './ChangelogOverlay.data';
import s from './ChangelogOverlay.module.css';
import { ChangelogOverlaySelectors } from './ChangelogOverlay.selectors';

export const ChangelogOverlay: FC = () => {
  const { popup } = useAppEnv();
  const { ready } = useTempleClient();
  const [lastShownVersion, setLastShownVersion] = useStorage(`last_shown_changelog_version`, APP_VERSION);

  const handleContinue = () => {
    setLastShownVersion(APP_VERSION);
  };
  const popupClassName = popup ? 'inset-0' : 'top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 p-12';

  const isNewerVersion = changelogData.find(e => e.version === APP_VERSION);
  if (!isNewerVersion) {
    return null;
  }

  const filteredChangelog = filterByVersion(lastShownVersion, changelogData);

  return ready && lastShownVersion !== APP_VERSION ? (
    <>
      <div className="fixed inset-0 opacity-20 bg-gray-700 z-overlay-promo"></div>

      <div className={classNames(LAYOUT_CONTAINER_CLASSNAME, 'fixed z-overlay-promo max-h-full', popupClassName)}>
        <div
          className={classNames(
            'bg-white shadow-lg relative',
            s.overlay_scrollbar,
            popup ? 'pt-12 px-8' : 'pt-16 rounded-md'
          )}
          style={{
            backgroundColor: `#FFF2E6`,
            minHeight: popup ? '100vh' : 200,
            maxHeight: popup ? '100vh' : 'calc(100vh - 96px)',
            paddingBottom: popup ? 104 : 160
          }}
        >
          <div className={classNames('flex flex-col max-w-sm mx-auto w-full')}>
            <p className="text-xl font-inter font-semibold" style={{ fontSize: 23, color: '#ED8936' }}>
              <T id="changelogTitle" />
            </p>

            {filteredChangelog.map(({ version, data }) => (
              <React.Fragment key={version}>
                <p className="mb-5 mt-8 font-inter" style={{ fontSize: 16 }}>
                  <T id="update" /> {version}
                </p>

                <ul>
                  {data?.map((value, index) => (
                    <li className="mb-1" style={{ listStyleType: 'disc' }} key={index}>
                      {value}
                    </li>
                  ))}
                </ul>
              </React.Fragment>
            ))}

            <div
              className={classNames(s.overlay_ok_container)}
              style={{
                height: popup ? 104 : 90,
                bottom: popup ? 0 : 48,
                left: popup ? 16 : 32,
                right: popup ? 16 : 32
              }}
            >
              <Button
                className={classNames(
                  'mx-auto py-2 text-white font-inter rounded font-semibold uppercase',
                  s.overlay_ok_button
                )}
                onClick={handleContinue}
                testID={ChangelogOverlaySelectors.continueButton}
                style={{
                  width: popup ? 270 : 384
                }}
              >
                <T id="okGotIt" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
};

const filterByVersion = (version: string | null | undefined, data: Array<ChangelogItem>): Array<ChangelogItem> => {
  let foundVersion: number | undefined;
  return data.filter((x, i) => {
    if (x.version === version) {
      foundVersion = i;
    }
    if (!x.data) return false;
    return typeof foundVersion === 'number' ? foundVersion > i : true;
  });
};
