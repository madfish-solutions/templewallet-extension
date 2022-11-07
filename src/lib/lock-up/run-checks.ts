/*
  Import as early as possible in extension pages.
  (!) Contains side-effects.
*/

import browser from 'webextension-polyfill';

import { request, assertResponse } from 'lib/temple/front';
import { TempleMessageType } from 'lib/temple/types';

import { getIsLockUpEnabled } from './index';

if (window.location.href.includes('extension://') === false)
  throw new Error('Lock-up checks are meant for extension pages only.');

const LOCK_TIME = 5 * 60_000;
const CLOSURE_STORAGE_KEY = 'last-page-closure-timestamp';

const isSinglePageOpened = () => getOpenedTemplePagesN() === 1;

// Locking if this page was first to open & lock time passed

if (getIsLockUpEnabled() && isSinglePageOpened()) {
  const closureTimestamp = Number(localStorage.getItem(CLOSURE_STORAGE_KEY));
  if (closureTimestamp && Date.now() - closureTimestamp >= LOCK_TIME) lock();
}

// Saving last time, when all pages are closed

window.addEventListener(
  'pagehide',
  () => {
    if (isSinglePageOpened()) localStorage.setItem(CLOSURE_STORAGE_KEY, Date.now().toString());
  },
  true
);

function getOpenedTemplePagesN() {
  const windowsN = browser.extension.getViews().length;
  const bgWindow: Window | null = browser.extension.getBackgroundPage();
  return bgWindow ? windowsN - 1 : windowsN;
}

async function lock() {
  const res = await request({
    type: TempleMessageType.LockRequest
  });
  assertResponse(res.type === TempleMessageType.LockResponse);
}
