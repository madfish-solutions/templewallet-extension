import React, { memo, useEffect, useState } from 'react';

import clsx from 'clsx';
import useSWR from 'swr';
import browser from 'webextension-polyfill';

import { FormSubmitButton } from 'app/atoms';
import { TOOLBAR_IS_STICKY } from 'app/layouts/PageLayout';
import { EmojiInlineIcon } from 'lib/icons/emoji';

const LONG_INTERVAL = 30 * 60_000;

export const UpdateAppBanner = memo(() => {
  const { data: availableByCheck } = useSWR(
    'check-for-app-update-available',
    () => browser.runtime.requestUpdateCheck().then(([status]) => status === 'update_available'),
    {
      refreshInterval: LONG_INTERVAL,
      dedupingInterval: LONG_INTERVAL
    }
  );

  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const listener = () => void setAvailable(true);

    browser.runtime.onUpdateAvailable.addListener(listener);

    return () => browser.runtime.onUpdateAvailable.removeListener(listener);
  }, []);

  if (!(available || availableByCheck)) return null;

  return (
    <div
      className={clsx(
        'sticky z-1 flex flex-col p-3 mb-3 bg-white rounded-md shadow-lg',
        TOOLBAR_IS_STICKY ? 'top-14' : 'top-3'
      )}
    >
      <h5 className="text-sm font-inter font-medium leading-4 text-gray-910">Update your Temple Wallet extension!</h5>

      <p className="mt-1 text-xs font-inter leading-5 text-gray-700">
        <EmojiInlineIcon name="party-popper-1f389" className="align-sub" /> Great news! The newest version of Temple
        Wallet is available in the store. Please, update your extension to unlock all the latest improvements.
      </p>

      <FormSubmitButton
        slim
        className="mt-3"
        onClick={
          // Applies updates if available. See:
          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/reload
          () => void browser.runtime.reload()
        }
      >
        Update now
      </FormSubmitButton>
    </div>
  );
});
