import type { Browser, Storage } from 'webextension-polyfill';
import browserDefault from 'webextension-polyfill';

import { IS_FIREFOX, IS_GOOGLE_CHROME_BROWSER, IS_MISES_BROWSER } from 'lib/env';

export { isBrowserVersionSafe } from './info';

export const browser = browserDefault as Browser & {
  storage: { session?: Storage.LocalStorageArea };
};

export type BrowserIdentifier = 'chrome' | 'firefox' | 'mises' | 'unknown';

function getBrowserIdentifier(): BrowserIdentifier {
  if (IS_MISES_BROWSER) return 'mises';
  if (IS_FIREFOX) return 'firefox';
  if (IS_GOOGLE_CHROME_BROWSER) return 'chrome';

  return 'unknown';
}

export const BROWSER_IDENTIFIER_HEADER = getBrowserIdentifier();
