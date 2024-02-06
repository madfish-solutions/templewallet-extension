import React, { memo, useMemo, useState } from 'react';

import clsx from 'clsx';
import browser from 'webextension-polyfill';

import { FormSubmitButton } from 'app/atoms';
import { TOOLBAR_IS_STICKY } from 'app/layouts/PageLayout';
import { AppUpdateDetails, useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { EmojiInlineIcon } from 'lib/icons/emoji';
import { useDidMount } from 'lib/ui/hooks';

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
    if (!updateDetails) return null;

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
    <div
      className={clsx(
        'sticky z-1 flex flex-col p-3 mb-3 bg-white rounded-md shadow-lg',
        TOOLBAR_IS_STICKY ? 'top-14' : 'top-3',
        popup && 'mx-4'
      )}
    >
      <h5 className="text-sm font-inter font-medium leading-4 text-gray-910">Update your Temple Wallet extension!</h5>

      <p className="mt-1 text-xs font-inter leading-5 text-gray-700">
        <EmojiInlineIcon name="party-popper-1f389" className="align-sub" /> Great news! The newest version of Temple
        Wallet is available in the store. Please, update your extension to unlock all the latest improvements.
      </p>

      <FormSubmitButton slim className="mt-3" onClick={onUpdateButtonPress ?? undefined}>
        Update now
      </FormSubmitButton>
    </div>
  );
});
