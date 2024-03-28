/*
  Import as early as possible in extension pages.
  (!) Contains side-effects.
*/

import browser from 'webextension-polyfill';

import { WALLET_AUTOLOCK_TIME } from 'lib/fixed-times';
import { TempleMessageType } from 'lib/temple/types';
import { makeIntercomRequest, assertResponse } from 'temple/front/intercom-client';

import { getIsLockUpEnabled } from './index';

if (window.location.href.includes('extension://') === false)
  throw new Error('Lock-up checks are meant for extension pages only.');

const CLOSURE_STORAGE_KEY = 'last-page-closure-timestamp';

const isSinglePageOpened = () => getOpenedTemplePagesN() === 1;

// Locking if this page was first to open & lock time passed

if (getIsLockUpEnabled() && isSinglePageOpened()) {
  const closureTimestamp = Number(localStorage.getItem(CLOSURE_STORAGE_KEY));
  if (closureTimestamp && Date.now() - closureTimestamp >= WALLET_AUTOLOCK_TIME) lock();
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
  const res = await makeIntercomRequest({
    type: TempleMessageType.LockRequest
  });
  assertResponse(res.type === TempleMessageType.LockResponse);
}
