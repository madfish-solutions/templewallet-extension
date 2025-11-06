import browser from 'webextension-polyfill';

import { useTypedSWR } from 'lib/swr';

const getThisWindowLocation = () =>
  Promise.all([browser.windows.getCurrent(), browser.tabs.getCurrent()]).then(([window, tab]) => ({
    windowId: window.id ?? null,
    tabId: tab?.id ?? null
  }));

export const useThisWindowLocation = () => useTypedSWR('window-location', getThisWindowLocation);
