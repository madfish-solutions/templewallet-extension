import React, { memo, useMemo, useState } from 'react';

import browser from 'webextension-polyfill';

import { AppUpdateDetails } from 'app/storage/app-update';
import { useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { EmojiInlineIcon } from 'lib/icons/emoji';
import { useDidMount } from 'lib/ui/hooks';

import { Banner } from './Banner';

interface Props {
  popup?: boolean;
}

export const UpdateAppBanner = memo<Props>(({ popup }) => {
  const [storedUpdateDetails, setStoredUpdateDetails] = useStoredAppUpdateDetails();

  const [checkedUpdateDetails, setCheckedUpdateDetails] = useState<AppUpdateDetails>();

  useDidMount(() => {
    // Only available in Chrome
    void browser.runtime.requestUpdateCheck?.().then(([status, details]) => {
      if (status === 'update_available') setCheckedUpdateDetails(details);
    });
  });

  const updateDetails = storedUpdateDetails || checkedUpdateDetails;

  const onUpdateButtonPress = useMemo(() => {
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

  if (!onUpdateButtonPress) return null;

  return (
    <Banner
      title="Update your Temple Wallet extension!"
      description={
        <>
          <EmojiInlineIcon key="emoji" name="party-popper-1f389" className="align-sub" />
          {
            ' Great news! The newest version of Temple Wallet is available in the store. Please, update your extension to unlock all the latest improvements.'
          }
        </>
      }
      actionName="Update now"
      popup={popup}
      onActionClick={onUpdateButtonPress}
    />
  );
});
