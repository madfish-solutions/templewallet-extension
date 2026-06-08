import browser from 'webextension-polyfill';

import { WEB_WIDGETS_LOCAL_AD_PERMIT } from 'lib/constants';
import { onStorageKey } from 'lib/web-widgets/storage';

export const readAdPermit = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(WEB_WIDGETS_LOCAL_AD_PERMIT);
  return Boolean(stored[WEB_WIDGETS_LOCAL_AD_PERMIT]);
};

export const grantAdPermit = (): Promise<void> => browser.storage.local.set({ [WEB_WIDGETS_LOCAL_AD_PERMIT]: true });

export const subscribeAdPermitGranted = (onGranted: EmptyFn): EmptyFn =>
  onStorageKey<boolean>(WEB_WIDGETS_LOCAL_AD_PERMIT, granted => {
    if (granted) onGranted();
  });
