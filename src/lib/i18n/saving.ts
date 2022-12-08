import { putToStorage } from 'lib/storage';

import { STORAGE_KEY } from './helpers';

export function getSavedLocale() {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveLocale(locale: string) {
  localStorage.setItem(STORAGE_KEY, locale);
  return putToStorage(STORAGE_KEY, locale);
}

/**
 * Migration. Relevant for updates from v1.14.13
 *
 * Needed, since background script becomes Service Worker with Manifest v3
 * and will no longer have access to window.localStorage API
 *
 * TODO: Remove/revert, if background script stops relying on locale
 */
(() => {
  const locale = getSavedLocale();
  if (locale) putToStorage(STORAGE_KEY, locale);
})();
