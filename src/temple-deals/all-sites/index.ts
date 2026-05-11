import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

import { injectTempleDealsPopupFont, mountTempleDealsPopup } from '../popup/layout';
import { isGoogleSearchPage, normalizeDomain, wasTempleDealActivated } from '../utils';

const POPUP_HOST_ID = 'temple-deals-popup-host';

(async () => {
  if (window.self !== window.top || isGoogleSearchPage()) return;

  const domain = normalizeDomain(window.location.hostname);

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
