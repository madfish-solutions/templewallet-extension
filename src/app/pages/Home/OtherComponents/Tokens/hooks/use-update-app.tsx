import { useMemo, useState } from 'react';

import browser from 'webextension-polyfill';

import { AppUpdateDetails, useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { useDidMount } from 'lib/ui/hooks';

export const useUpdateApp = () => {
  const [storedUpdateDetails, setStoredUpdateDetails] = useStoredAppUpdateDetails();

  const [checkedUpdateDetails, setCheckedUpdateDetails] = useState<AppUpdateDetails>();

  useDidMount(() => {
    // Only available in Chrome
    void browser.runtime.requestUpdateCheck?.().then(([status, details]) => {
      if (status === 'update_available') setCheckedUpdateDetails(details);
    });
  });

  const updateDetails = storedUpdateDetails || checkedUpdateDetails;

  return useMemo(() => {
    if (!updateDetails) return undefined;

    return async () => {
      await setStoredUpdateDetails({
        ...updateDetails,
        triggeredManually: true
      });

      // Applies updates if available. See:
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/reload
      browser.runtime.reload();
    };
  }, [updateDetails, setStoredUpdateDetails]);
};
