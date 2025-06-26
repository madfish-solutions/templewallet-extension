import browser from 'webextension-polyfill';

import FallbackSrc from './assets/token-fallback.svg?url';

export const TOKEN_FALLBACK_ICON_SRC = FallbackSrc;

export namespace TOKENS_ICONS_SRC {
  export const TEZ = browser.runtime.getURL('misc/token-logos/tez.svg');
}
