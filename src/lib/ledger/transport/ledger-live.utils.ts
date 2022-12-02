import WebSocketTransport from '@ledgerhq/hw-transport-http/lib-es/WebSocketTransport';
import type Browser from 'webextension-polyfill';

/* URL which triggers Ledger Live app to open and handle communication */
export const LEDGER_LIVE_APP_WS_URL = 'ws://localhost:8435';

/* Period in milliseconds to poll for Ledger Live app opening */
const APP_POLLING_DELAY = 1_000;
/* Number of periods to poll for Ledger Live app opening */
const APP_POLLING_LIMIT = 120;

export const openLedgerLiveTransport = (): Promise<WebSocketTransport> =>
  WebSocketTransport.open(LEDGER_LIVE_APP_WS_URL);

export const isLedgerLiveAppOpen = async () => {
  try {
    await WebSocketTransport.check(LEDGER_LIVE_APP_WS_URL);
    return true;
  } catch {
    return false;
  }
};

export const openLedgerLiveApp = async () => {
  // if (await isLedgerLiveAppOpen()) return;

  await openLedgerLiveAppXDGLink();

  for (let i = 0; i < APP_POLLING_LIMIT; i++) {
    await new Promise(r => setTimeout(r, APP_POLLING_DELAY));
    if (await isLedgerLiveAppOpen()) return;
  }

  throw new Error('Ledger transport check timeout');
};

const openLedgerLiveAppXDGLink = async () => {
  const url = 'ledgerlive://bridge?appName=Tezos Wallet';

  try {
    await openXDGLinkWithBrowserExtensionTab(url);
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

const openXDGLinkWithBrowserExtensionTab = async (url: string) => {
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
