import { TEMPLE_ICON } from 'content-scripts/constants';
import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType, TERMS_OF_USE_URL, PRIVACY_POLICY_URL } from 'lib/constants';

import { CLOSE_ICON, DISABLE_ICON, SETTINGS_ICON, SNOOZE_ICON } from './icons';
import { getPopupStyles } from './styles';
import { el, msg, stripSubdomain, trackMerchantOfferEvent } from './utils';

const POPUP_HOST_ID = 'temple-merchant-offer-host';
const ACTIVATED_KEY_PREFIX = 'temple-merchant-offer-activated:';

(async () => {
  // Only run in the main window, not iframes
  if (window.self !== window.top) return;

  const domain = stripSubdomain(window.location.hostname, 'www');

  // Don't show the popup again if the offer was already activated in this session
  if (sessionStorage.getItem(`${ACTIVATED_KEY_PREFIX}${domain}`)) return;

  let offer: MerchantOffer | null = null;

  try {
    offer = await browser.runtime.sendMessage({
      type: ContentScriptType.FetchMerchantOffer,
      domain
    });
  } catch {
    return;
  }

  if (!offer) return;

  injectPopup(offer, domain);
})();

function injectPopup(offer: MerchantOffer, domain: string) {
  // Prevent duplicate injection
  if (document.getElementById(POPUP_HOST_ID)) return;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
  document.head.appendChild(fontLink);

  const host = document.createElement('div');
  host.id = POPUP_HOST_ID;
  host.style.cssText = 'all: initial; position: fixed; top: 16px; right: 16px; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getPopupStyles();
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'tw-popup';
  shadow.appendChild(container);

  let settingsOpen = false;
  let showMoreExpanded = false;
  let cleanupOutsideClick: (() => void) | null = null;

  const offerDescription =
    offer.description && offer.description.trim().split(/\s+/).length > 3
      ? offer.description
      : msg('merchantOfferPopupActivateDescription', offer.name);

  function render() {
    cleanupOutsideClick?.();
    cleanupOutsideClick = null;
    container.textContent = '';

    // Header
    const header = el('div', 'tw-popup-header');

    const templeIcon = document.createElement('img');
    templeIcon.className = 'tw-popup-temple-icon';
    templeIcon.src = TEMPLE_ICON;
    templeIcon.alt = '';
    header.appendChild(templeIcon);

    const title = el('span', 'tw-popup-title', msg('merchantOfferPopupTitle'));
    header.appendChild(title);

    const headerActions = el('div', 'tw-popup-header-actions');

    const settingsBtn = el(
      'button',
      settingsOpen ? 'tw-popup-settings-btn tw-popup-settings-btn-open' : 'tw-popup-settings-btn',
      msg('merchantOfferPopupSettings')
    );
    settingsBtn.title = msg('merchantOfferPopupSettings');
    settingsBtn.innerHTML += ` ${SETTINGS_ICON}`;
    settingsBtn.addEventListener('click', () => {
      settingsOpen = !settingsOpen;
      render();
    });
    headerActions.appendChild(settingsBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tw-popup-btn-icon tw-popup-close-btn';
    closeBtn.title = 'Close';
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.addEventListener('click', () => {
      trackMerchantOfferEvent('MerchantOfferPopupClose', { domain });
      host.remove();
    });
    headerActions.appendChild(closeBtn);

    header.appendChild(headerActions);
    container.appendChild(header);

    // Settings dropdown
    if (settingsOpen) {
      const dropdown = el('div', 'tw-popup-settings-dropdown');

      const snoozeBtn = document.createElement('button');
      snoozeBtn.className = 'tw-popup-dropdown-item tw-popup-dropdown-item-snooze';
      snoozeBtn.innerHTML = SNOOZE_ICON;
      snoozeBtn.appendChild(document.createTextNode(` ${msg('merchantOfferPopupSnooze')}`));
      snoozeBtn.addEventListener('click', async () => {
        trackMerchantOfferEvent('MerchantOfferPopupSnooze', { domain });
        await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferSnooze });
        host.remove();
      });
      dropdown.appendChild(snoozeBtn);

      const disableBtn = document.createElement('button');
      disableBtn.className = 'tw-popup-dropdown-item tw-popup-dropdown-item-disable';
      disableBtn.innerHTML = DISABLE_ICON;
      const disableText = el('span', '', msg('disable'));
      disableText.style.color = '#FF3B30';
      disableBtn.appendChild(document.createTextNode(' '));
      disableBtn.appendChild(disableText);
      disableBtn.addEventListener('click', async () => {
        trackMerchantOfferEvent('MerchantOfferPopupDisable', { domain });
        await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferDisable });
        host.remove();
      });
      dropdown.appendChild(disableBtn);

      container.appendChild(dropdown);

      const onOutsideClick = (e: Event) => {
        if (!dropdown.contains(e.target as Node) && !settingsBtn.contains(e.target as Node)) {
          settingsOpen = false;
          render();
        }
      };
      setTimeout(() => {
        shadow.addEventListener('click', onOutsideClick);
        cleanupOutsideClick = () => shadow.removeEventListener('click', onOutsideClick);
      });
    }

    // Body
    const body = el('div', 'tw-popup-body');

    const offerCard = el('div', 'tw-popup-offer-card');

    if (offer.imageUri) {
      const merchantIcon = document.createElement('img');
      merchantIcon.className = 'tw-popup-merchant-icon';
      merchantIcon.src = offer.imageUri;
      merchantIcon.alt = '';
      offerCard.appendChild(merchantIcon);
    } else {
      offerCard.appendChild(el('div', 'tw-popup-merchant-icon-placeholder'));
    }

    const offerInfo = el('div', 'tw-popup-offer-info');
    offerInfo.appendChild(
      el(
        'div',
        'tw-popup-offer-title',
        msg('merchantOfferPopupEarnUpTo', [offer.cpcRate.toFixed(2), offer.currencyCode])
      )
    );

    const descEl = el(
      'div',
      showMoreExpanded ? 'tw-popup-offer-desc' : 'tw-popup-offer-desc tw-popup-offer-desc-clamped',
      offerDescription
    );
    offerInfo.appendChild(descEl);

    requestAnimationFrame(() => {
      if (showMoreExpanded || descEl.scrollHeight > descEl.clientHeight) {
        const toggle = el(
          'button',
          'tw-popup-show-more',
          msg(showMoreExpanded ? 'merchantOfferPopupShowLess' : 'merchantOfferPopupShowMore')
        );
        toggle.addEventListener('click', () => {
          showMoreExpanded = !showMoreExpanded;
          render();
        });
        offerInfo.appendChild(toggle);
      }
    });

    offerCard.appendChild(offerInfo);

    body.appendChild(offerCard);

    const activateBtn = document.createElement('button');
    activateBtn.className = 'tw-popup-activate-btn';
    activateBtn.textContent = msg('merchantOfferPopupActivate');
    activateBtn.addEventListener('click', async () => {
      activateBtn.textContent = msg('merchantOfferPopupActivating');
      activateBtn.disabled = true;

      try {
        const result = await browser.runtime.sendMessage({
          type: ContentScriptType.ActivateMerchantOffer,
          url: window.location.origin
        });

        if (result?.trackingLink) {
          trackMerchantOfferEvent('MerchantOfferPopupActivate', { domain });

          browser.runtime
            .sendMessage({
              type: ContentScriptType.ReferralClick,
              urlDomain: domain,
              pageDomain: domain,
              provider: 'TakeAds'
            })
            .catch(() => {});

          sessionStorage.setItem(`${ACTIVATED_KEY_PREFIX}${domain}`, '1');

          window.location.href = result.trackingLink;
        } else {
          activateBtn.textContent = msg('merchantOfferPopupActivate');
          activateBtn.disabled = false;
        }
      } catch (err) {
        console.error('Failed to activate merchant offer:', err);
        activateBtn.textContent = msg('merchantOfferPopupActivate');
        activateBtn.disabled = false;
      }
    });
    body.appendChild(activateBtn);

    const disclaimer = el('div', 'tw-popup-disclaimer');
    disclaimer.innerHTML = [
      `${msg('merchantOfferPopupDisclaimer1')}`,
      `<a href="${TERMS_OF_USE_URL}" target="_blank">${msg('termsOfUsage')}</a>`,
      `${msg('merchantOfferPopupDisclaimer2')}`,
      `<a href="${PRIVACY_POLICY_URL}" target="_blank">${msg('privacyPolicy')}</a>`
    ].join(' ');
    body.appendChild(disclaimer);

    container.appendChild(body);
  }

  render();
}
