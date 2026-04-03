import { useEffect } from 'react';

import browser, { Storage } from 'webextension-polyfill';

import { dispatch } from 'app/store';
import { setMerchantPromotionEnabledAction } from 'app/store/merchant-promotion/actions';
import type { MerchantPromotionState } from 'app/store/merchant-promotion/state';

const PERSIST_KEY = 'persist:root.merchantPromotion';

/** Syncs external storage writes (content script MerchantOfferDisable) back to Redux. */
export const useMerchantPromotionSync = () => {
  useEffect(() => {
    // eslint-disable-next-line consistent-type-assertions
    const handleChanged = ((changes: { [s: string]: Storage.StorageChange }) => {
      if (PERSIST_KEY in changes) {
        const newState: MerchantPromotionState | undefined = changes[PERSIST_KEY].newValue;
        if (newState) {
          dispatch(setMerchantPromotionEnabledAction(newState.enabled));
        }
      }
    }) as unknown as (changes: Storage.StorageAreaOnChangedChangesType) => void;

    browser.storage.local.onChanged.addListener(handleChanged);

    return () => browser.storage.local.onChanged.removeListener(handleChanged);
  }, []);
};
