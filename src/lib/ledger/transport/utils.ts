import type Browser from 'webextension-polyfill';

export const openLedgerLiveApp = async () => {
  const url = 'ledgerlive://bridge?appName=Tezos Wallet';

  try {
    await openLedgerLiveAppThroughTabCreation(url);
  } catch {
    if (typeof window === 'undefined') {
      /* Implying Service Worker environment */
      // @ts-ignore
      await clients.openWindow(url);
    } else {
      window.open(url);
    }
  }
};

const openLedgerLiveAppThroughTabCreation = async (url: string) => {
  // @ts-ignore
  const browser: typeof Browser = globalThis.chrome || globalThis.browser;

  if (browser == null) throw new Error('Not browser extension');

  const tab = await new Promise<Browser.Tabs.Tab>(resolve =>
    browser.tabs.create(
      { url },
      // @ts-ignore
      resolve
    )
  );

  const tabId = tab.id!;
  const windowId = tab.windowId!;

  await browser.windows.update(windowId, { focused: true });

  const removeTab = () =>
    browser.tabs.remove(
      tabId,
      // @ts-ignore
      () => void browser.runtime.lastError
    );

  const tabListener = (info: Browser.Tabs.OnActivatedActiveInfoType) => {
    if (info.tabId === tabId || info.previousTabId === tabId) return;

    browser.tabs.onActivated.removeListener(tabListener);
    removeTab();
  };

  browser.tabs.onActivated.addListener(tabListener);

  const windowListener = () => {
    browser.windows.get(
      windowId,
      undefined,
      // @ts-ignore
      (tabWindow?: Browser.Windows.Window) => {
        if (tabWindow?.focused) return;
        browser.windows.onFocusChanged.removeListener(windowListener);
        removeTab();
      }
    );
  };

  browser.windows.onFocusChanged.addListener(windowListener);
};
