import { TEMPLE_ICON } from 'content-scripts/constants';
import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'lib/constants';

import {
  el,
  formatBountyValue,
  getOfferDescription,
  markTempleDealActivated,
  msg,
  trackTempleDealsEvent
} from '../utils';

import { CLOSE_ICON, DISABLE_ICON, SETTINGS_ICON, SNOOZE_ICON } from './icons';
import { getPopupStyles } from './styles';

const POPUP_FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';

export interface TempleDealsPopupOptions {
  offer: MerchantOffer;
  domain: string;
  activationUrl: string;
  pageDomain: string;
  closeTitle?: string;
  activateEvent: string;
  closeEvent: string;
  showSettings?: boolean;
  showDescriptionToggle?: boolean;
  onClose: () => void;
}

export function injectTempleDealsPopupFont() {
  if (document.querySelector<HTMLLinkElement>(`link[href="${POPUP_FONT_URL}"]`)) return;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = POPUP_FONT_URL;
  document.head.appendChild(fontLink);
}

export function mountTempleDealsPopup(host: HTMLElement, options: TempleDealsPopupOptions) {
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getPopupStyles();
  shadow.appendChild(style);

  const container = document.createElement('div');
  shadow.appendChild(container);

  renderTempleDealsPopup(container, shadow, options);
}

function renderTempleDealsPopup(
  container: HTMLElement,
  shadow: ShadowRoot,
  {
    offer,
    domain,
    activationUrl,
    pageDomain,
    closeTitle = 'Close',
    activateEvent,
    closeEvent,
    showSettings = false,
    showDescriptionToggle = false,
    onClose
  }: TempleDealsPopupOptions
) {
  let settingsOpen = false;
  let showMoreExpanded = false;
  let cleanupOutsideClick: (() => void) | null = null;
  const offerDescription = getOfferDescription(offer);

  function render() {
    cleanupOutsideClick?.();
    cleanupOutsideClick = null;
    container.textContent = '';

    const popup = el('div', 'tw-popup');
    popup.appendChild(renderHeader());

    if (showSettings && settingsOpen) {
      popup.appendChild(renderSettingsDropdown());
    }

    popup.appendChild(renderBody());
    container.appendChild(popup);
  }

  function renderHeader() {
    const header = el('div', 'tw-popup-header');

    const templeIcon = document.createElement('img');
    templeIcon.className = 'tw-popup-temple-icon';
    templeIcon.src = TEMPLE_ICON;
    templeIcon.alt = '';
    header.appendChild(templeIcon);

    header.appendChild(el('span', 'tw-popup-title', msg('merchantOfferPopupTitle')));

    const headerActions = el('div', 'tw-popup-header-actions');

    if (showSettings) {
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
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tw-popup-btn-icon tw-popup-close-btn';
    closeBtn.title = closeTitle;
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.addEventListener('click', () => {
      trackTempleDealsEvent(closeEvent, { domain });
      onClose();
    });
    headerActions.appendChild(closeBtn);

    header.appendChild(headerActions);

    return header;
  }

  function renderSettingsDropdown() {
    const dropdown = el('div', 'tw-popup-settings-dropdown');

    const snoozeBtn = document.createElement('button');
    snoozeBtn.className = 'tw-popup-dropdown-item tw-popup-dropdown-item-snooze';
    snoozeBtn.innerHTML = SNOOZE_ICON;
    snoozeBtn.appendChild(document.createTextNode(` ${msg('merchantOfferPopupSnooze')}`));
    snoozeBtn.addEventListener('click', async () => {
      trackTempleDealsEvent('MerchantOfferPopupSnooze', { domain });
      await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferSnooze });
      onClose();
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
      trackTempleDealsEvent('MerchantOfferPopupDisable', { domain });
      await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferDisable });
      onClose();
    });
    dropdown.appendChild(disableBtn);

    const onOutsideClick = (e: Event) => {
      const settingsBtn = container.querySelector('.tw-popup-settings-btn');

      if (!dropdown.contains(e.target as Node) && !settingsBtn?.contains(e.target as Node)) {
        settingsOpen = false;
        render();
      }
    };
    setTimeout(() => {
      shadow.addEventListener('click', onOutsideClick);
      cleanupOutsideClick = () => shadow.removeEventListener('click', onOutsideClick);
    });

    return dropdown;
  }

  function renderBody() {
    const body = el('div', 'tw-popup-body');

    body.appendChild(renderOfferCard());
    body.appendChild(renderActivateButton());
    body.appendChild(renderDisclaimer());

    return body;
  }

  function renderOfferCard() {
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
        msg('merchantOfferPopupEarnUpTo', formatBountyValue(offer.cpcRate, offer.currencyCode).split(' '))
      )
    );

    const descEl = el(
      'div',
      showDescriptionToggle && !showMoreExpanded
        ? 'tw-popup-offer-desc tw-popup-offer-desc-clamped'
        : 'tw-popup-offer-desc',
      offerDescription
    );
    offerInfo.appendChild(descEl);

    if (showDescriptionToggle) {
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
    }

    offerCard.appendChild(offerInfo);

    return offerCard;
  }

  function renderActivateButton() {
    const activateBtn = document.createElement('button');
    activateBtn.className = 'tw-popup-activate-btn';
    activateBtn.textContent = msg('merchantOfferPopupActivate');
    activateBtn.addEventListener('click', async () => {
      activateBtn.textContent = msg('merchantOfferPopupActivating');
      activateBtn.disabled = true;

      try {
        const result = await browser.runtime.sendMessage({
          type: ContentScriptType.ActivateMerchantOffer,
          url: activationUrl
        });

        if (!result?.trackingLink) {
          activateBtn.textContent = msg('merchantOfferPopupActivate');
          activateBtn.disabled = false;
          return;
        }

        trackTempleDealsEvent(activateEvent, { domain });
        await browser.runtime
          .sendMessage({
            type: ContentScriptType.ReferralClick,
            urlDomain: domain,
            pageDomain,
            provider: 'TakeAds'
          })
          .catch(() => {});
        await markTempleDealActivated(domain);

        window.location.href = result.trackingLink;
      } catch (err) {
        console.error('Failed to activate merchant offer:', err);
        activateBtn.textContent = msg('merchantOfferPopupActivate');
        activateBtn.disabled = false;
      }
    });

    return activateBtn;
  }

  function renderDisclaimer() {
    const disclaimer = el('div', 'tw-popup-disclaimer');
    disclaimer.innerHTML = [
      `${msg('merchantOfferPopupDisclaimer1')}`,
      `<a href="${TERMS_OF_USE_URL}" target="_blank">${msg('termsOfUsage')}</a>`,
      `${msg('merchantOfferPopupDisclaimer2')}`,
      `<a href="${PRIVACY_POLICY_URL}" target="_blank">${msg('privacyPolicy')}</a>`
    ].join(' ');

    return disclaimer;
  }

  render();
}
