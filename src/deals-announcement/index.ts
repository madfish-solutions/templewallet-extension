import type { MerchantPromotionState } from 'app/store/merchant-promotion/state';
import { browser } from 'lib/browser';
import { ContentScriptType, DEALS_ANNOUNCEMENT_SHOWN_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

import { renderPreActivationState, renderPostActivationState } from './popup';
import { getDealsAnnouncementStyles } from './styles';
import { DEALS_ANNOUNCEMENT_GOOGLE_SEARCH_EVENTS, trackDealsAnnouncementGoogleSearchEvent } from './utils';

const POPUP_HOST_ID = 'temple-deals-announcement-host';
const MERCHANT_PROMOTION_STORAGE_KEY = 'persist:root.merchantPromotion';

(async () => {
  if (window.self !== window.top) return;
  if (window.location.hostname !== 'www.google.com') return;
  if (!window.location.pathname.startsWith('/search')) return;

  const alreadyShown = await fetchFromStorage<boolean>(DEALS_ANNOUNCEMENT_SHOWN_STORAGE_KEY);
  if (alreadyShown === true) return;

  const merchantState = await fetchFromStorage<MerchantPromotionState>(MERCHANT_PROMOTION_STORAGE_KEY);
  if (merchantState?.enabled) {
    browser.runtime.sendMessage({ type: ContentScriptType.MarkDealsAnnouncementSeen }).catch(() => {});
    return;
  }

  if (document.getElementById(POPUP_HOST_ID)) return;

  injectAnnouncement();
})();

function injectAnnouncement() {
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap';
  document.head.appendChild(fontLink);

  const host = document.createElement('div');
  host.id = POPUP_HOST_ID;
  host.style.cssText = 'all: initial; position: fixed; top: 16px; right: 16px; z-index: 2147483647;';
  document.body.appendChild(host);

  window.addEventListener('pagehide', () => host.remove(), { once: true });

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getDealsAnnouncementStyles();
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'tw-deals-popup';
  shadow.appendChild(container);

  browser.runtime.sendMessage({ type: ContentScriptType.MarkDealsAnnouncementSeen }).catch(() => {});

  trackDealsAnnouncementGoogleSearchEvent(DEALS_ANNOUNCEMENT_GOOGLE_SEARCH_EVENTS.view);

  const dismiss = () => host.remove();

  renderPreActivationState(container, {
    onActivate: async () => {
      try {
        await browser.runtime.sendMessage({ type: ContentScriptType.ActivateDealsAnnouncement });
        trackDealsAnnouncementGoogleSearchEvent(DEALS_ANNOUNCEMENT_GOOGLE_SEARCH_EVENTS.activate);
        renderPostActivationState(container, {
          onGotIt: dismiss,
          onClose: () => {
            trackDealsAnnouncementGoogleSearchEvent(DEALS_ANNOUNCEMENT_GOOGLE_SEARCH_EVENTS.close);
            dismiss();
          }
        });
      } catch (err) {
        console.error('Deals announcement activation failed:', err);
      }
    },
    onClose: () => {
      trackDealsAnnouncementGoogleSearchEvent(DEALS_ANNOUNCEMENT_GOOGLE_SEARCH_EVENTS.close);
      dismiss();
    }
  });
}
