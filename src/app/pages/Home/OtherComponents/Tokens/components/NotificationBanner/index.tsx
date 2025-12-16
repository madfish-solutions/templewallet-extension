import React, { FC, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { compare } from 'compare-versions';
import memoizee from 'memoizee';
import browser from 'webextension-polyfill';

import { AppUpdateDetails, useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { SHOULD_HIDE_ENABLE_ADS_BANNER_STORAGE_KEY } from 'lib/constants';
import { APP_VERSION } from 'lib/env';
import { useStorage } from 'lib/temple/front';
import { useDidMount } from 'lib/ui/hooks';
import { ONE_HOUR_MS } from 'lib/utils/numbers';

import { EnableAdsBanner } from './enable-ads-banner';
import { UpdateAppBanner } from './update-app-banner';

class UpdateCheckNotAvailableError extends Error {
  constructor() {
    super('browser.runtime.requestUpdateCheck is not defined');
  }
}

class UpdateCheckThrottledError extends Error {
  constructor() {
    super('Status check has been throttled, try again later to see if an update is available');
  }
}

const checkForUpdate = memoizee(
  async () => {
    if (isDefined(browser.runtime.requestUpdateCheck)) {
      const [status, details] = await browser.runtime.requestUpdateCheck();

      if (status === 'throttled') throw new UpdateCheckThrottledError();

      return [status, details] as const;
    }

    throw new UpdateCheckNotAvailableError();
  },
  { promise: true, maxAge: ONE_HOUR_MS }
);

export const NotificationBanner: FC = () => {
  const [storedUpdateDetails, setStoredUpdateDetails] = useStoredAppUpdateDetails();
  const [isUpdateChecked, setIsUpdateChecked] = useState(false);

  const [checkedUpdateDetails, setCheckedUpdateDetails] = useState<AppUpdateDetails>();

  const [shouldHideEnableAdsBanner, setShouldHideEnableAdsBanner] = useStorage(
    SHOULD_HIDE_ENABLE_ADS_BANNER_STORAGE_KEY
  );
  const adsEnabled = useShouldShowPartnersPromoSelector();

  useEffect(
    () => void (!shouldHideEnableAdsBanner && adsEnabled && setShouldHideEnableAdsBanner(true)),
    [shouldHideEnableAdsBanner, adsEnabled, setShouldHideEnableAdsBanner]
  );

  const isStoredVersionOutdated = useMemo(
    () => Boolean(storedUpdateDetails?.version && compare(storedUpdateDetails.version, APP_VERSION, '<=')),
    [storedUpdateDetails]
  );

  useDidMount(() => {
    if (isStoredVersionOutdated) setStoredUpdateDetails(null);

    checkForUpdate()
      .then(([status, details]) => {
        if (status === 'update_available') setCheckedUpdateDetails(details);
      })
      .catch(e => {
        if (e instanceof UpdateCheckThrottledError) {
          // TODO: Remove after testing
          Promise.resolve(e.message).then(console.warn);
        }
      })
      .finally(() => setIsUpdateChecked(true));
  });

  const updateDetails = storedUpdateDetails || checkedUpdateDetails;

  const handleUpdate = useMemo(() => {
    if (!updateDetails || isStoredVersionOutdated) return;

    return async () => {
      await setStoredUpdateDetails({
        ...updateDetails,
        triggeredManually: true
      });

      // Applies updates if available. See:
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/reload
      browser.runtime.reload();
    };
  }, [updateDetails, isStoredVersionOutdated, setStoredUpdateDetails]);

  if (handleUpdate) {
    return <UpdateAppBanner onClick={handleUpdate} />;
  }

  return shouldHideEnableAdsBanner || adsEnabled || !isUpdateChecked ? null : <EnableAdsBanner />;
};
