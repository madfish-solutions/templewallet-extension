import { useEffect } from 'react';

import browser, { Storage } from 'webextension-polyfill';

import { dispatch } from 'app/store';
import { setDealsEnabledAction } from 'app/store/deals/actions';
import type { DealsState } from 'app/store/deals/state';

const PERSIST_KEY = 'persist:root.deals';

/** Syncs external storage writes (content script DealsOfferDisable) back to Redux. */
export const useDealsSync = () => {
  useEffect(() => {
    // eslint-disable-next-line consistent-type-assertions
    const handleChanged = ((changes: { [s: string]: Storage.StorageChange }) => {
      if (PERSIST_KEY in changes) {
        const newState: DealsState | undefined = changes[PERSIST_KEY].newValue;
        if (newState) {
          dispatch(setDealsEnabledAction(newState.enabled));
        }
      }
    }) as unknown as (changes: Storage.StorageAreaOnChangedChangesType) => void;

    browser.storage.local.onChanged.addListener(handleChanged);

    return () => browser.storage.local.onChanged.removeListener(handleChanged);
  }, []);
};
