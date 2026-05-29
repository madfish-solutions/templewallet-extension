import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import { delay } from 'lib/utils';

import { injectTempleDealsPopupFont, mountTempleDealsPopup } from '../popup/layout';
import {
  isGoogleSearchPage,
  isTempleDealPopupSuppressed,
  normalizeDomain,
  suppressTempleDealPopup,
} from '../utils';

const POPUP_HOST_ID = 'temple-deals-popup-host';
const PAGE_STABLE_DELAY = 1_500;
const PAGE_STABLE_CHECK_INTERVAL = 250;
const PAGE_STABLE_TIMEOUT = 8_000;

(async () => {
  if (window.self !== window.top || isGoogleSearchPage()) return;

  const stableHref = await waitForStablePage();
  const domain = normalizeDomain(window.location.hostname);

  if (await isTempleDealPopupSuppressed(domain)) return;

  let offers: MerchantOffer[] = [];

  try {
    offers = await browser.runtime.sendMessage({
      type: ContentScriptType.FetchMerchantOffers,
      domains: [domain]
    });
  } catch {
    return;
  }

  const offer = offers.at(0);
  if (!offer) return;
  if (window.location.href !== stableHref || normalizeDomain(window.location.hostname) !== domain) return;

  await injectTempleDealsPopup(offer, domain);
})();

async function waitForStablePage() {
  await waitForWindowLoad();

  const startedAt = Date.now();
  let stableHref = window.location.href;
  let stableSince = Date.now();

  while (Date.now() - startedAt < PAGE_STABLE_TIMEOUT) {
    await delay(PAGE_STABLE_CHECK_INTERVAL);

    if (window.location.href !== stableHref) {
      stableHref = window.location.href;
      stableSince = Date.now();
      continue;
    }

    if (Date.now() - stableSince >= PAGE_STABLE_DELAY) return stableHref;
  }

  return window.location.href;
}

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();

  return new Promise<void>(resolve => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

async function injectTempleDealsPopup(offer: MerchantOffer, domain: string) {
  // Prevent duplicate injection
  if (!document.body || document.getElementById(POPUP_HOST_ID)) return;

  await suppressTempleDealPopup(domain);
  injectTempleDealsPopupFont();

  const host = document.createElement('div');
  host.id = POPUP_HOST_ID;
  host.style.cssText = 'all: initial; position: fixed; top: 16px; right: 16px; z-index: 2147483647;';
  document.body.appendChild(host);

  mountTempleDealsPopup(host, {
    offer,
    domain,
    activationUrl: window.location.origin,
    pageDomain: domain,
    activationSource: 'popup',
    showSettings: true,
    showDescriptionToggle: true,
    onClose: () => host.remove()
  });
}
