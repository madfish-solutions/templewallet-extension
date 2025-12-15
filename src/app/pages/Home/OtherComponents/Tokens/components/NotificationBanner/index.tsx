import React, { FC, useEffect, useMemo, useState } from 'react';

import { compare } from 'compare-versions';
import browser from 'webextension-polyfill';

import { AppUpdateDetails, useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { SHOULD_HIDE_ENABLE_ADS_BANNER_STORAGE_KEY } from 'lib/constants';
import { APP_VERSION } from 'lib/env';
import { useStorage } from 'lib/temple/front';
import { useDidMount } from 'lib/ui/hooks';

import { EnableAdsBanner } from './enable-ads-banner';
import { UpdateAppBanner } from './update-app-banner';

export const NotificationBanner: FC = () => {
  const [storedUpdateDetails, setStoredUpdateDetails] = useStoredAppUpdateDetails();

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

    // Only available in Chrome
    void browser.runtime.requestUpdateCheck?.().then(([status, details]) => {
      if (status === 'update_available') setCheckedUpdateDetails(details);
    });
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

  return shouldHideEnableAdsBanner || adsEnabled ? null : <EnableAdsBanner />;
};
