import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

import { injectTempleDealsPopupFont, mountTempleDealsPopup } from '../popup/layout';
import { normalizeDomain, wasTempleDealActivated } from '../utils';

const POPUP_HOST_ID = 'temple-deals-popup-host';

(async () => {
  // Only run in the main window, not iframes
  if (window.self !== window.top) return;
  if (/^www\.google\./.test(window.location.hostname) && window.location.pathname === '/search') return;

  const domain = normalizeDomain(window.location.hostname);

  // Don't show the popup again if the offer was already activated in this session
  if (await wasTempleDealActivated(domain)) return;

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

  injectTempleDealsPopup(offer, domain);
})();

function injectTempleDealsPopup(offer: MerchantOffer, domain: string) {
  // Prevent duplicate injection
  if (document.getElementById(POPUP_HOST_ID)) return;

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
    activateEvent: 'MerchantOfferPopupActivate',
    closeEvent: 'MerchantOfferPopupClose',
    showSettings: true,
    showDescriptionToggle: true,
    onClose: () => host.remove()
  });
}
