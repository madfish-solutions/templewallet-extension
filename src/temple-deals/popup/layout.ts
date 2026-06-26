import { TEMPLE_ICON } from 'content-scripts/constants';
import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import { DISABLE_ICON_SVG, SNOOZE_ICON_SVG } from 'lib/icons/snooze-disable-icons';

import {
  el,
  getOfferActivateText,
  getOfferActivationEvent,
  getOfferAnalyticsProperties,
  getOfferDescription,
  getOfferTitle,
  getOfferViewEvent,
  suppressTempleDealPopup,
  msg,
  type TempleDealsActivationSource,
  TEMPLE_DEALS_EVENTS,
  trackTempleDealsEvent
} from '../utils';

import { CLOSE_ICON, SETTINGS_ICON } from './icons';
import { getPopupStyles } from './styles';

const POPUP_FONT_TEXT =
  ' _-,;:!?.\'"()[]{}@*/\\&#%`+<>|~≈$£¥€₴₺₿0123456789aAbBcCçdDeEéèfFgGhHiIıjJkKlLmMnNoOõpPqQrRsSştTuUvVwWxXyYzZ';
const POPUP_FONT_URL = `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap&text=${encodeURIComponent(
  POPUP_FONT_TEXT
)}`;

interface TempleDealsPopupOptions {
  offer: MerchantOffer;
  domain: string;
  activationUrl: string;
  pageDomain: string;
  closeTitle?: string;
  activationSource: TempleDealsActivationSource;
  showSettings?: boolean;
  onSettingsChange?: () => void;
  onClose: () => void;
}

export function injectTempleDealsPopupFont() {
  if (document.querySelector<HTMLLinkElement>(`link[href="${POPUP_FONT_URL}"]`)) return;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = POPUP_FONT_URL;
  document.head.appendChild(fontLink);
}

function createDropdownIcon(svgMarkup: string, color: string): SVGElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = svgMarkup;
  const icon = wrapper.firstElementChild as SVGElement;
  icon.classList.add('tw-popup-dropdown-icon');
  icon.style.color = color;

  return icon;
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
    activationSource,
    showSettings = true,
    onSettingsChange,
    onClose
  }: TempleDealsPopupOptions
) {
  let settingsOpen = false;
  let showMoreExpanded = false;
  let cleanupOutsideClick: (() => void) | null = null;
  let outsideClickTimeout: number | null = null;
  const offerDescription = getOfferDescription(offer);
  const activateText = getOfferActivateText(offer);
  let popupEl: HTMLElement | null = null;
  let settingsBtn: HTMLButtonElement | null = null;
  let settingsDropdown: HTMLElement | null = null;

  trackTempleDealsEvent(getOfferViewEvent(offer), getOfferAnalyticsProperties(offer, domain), 'General');

  function render() {
    cleanupOutsideClick?.();
    cleanupOutsideClick = null;
    clearOutsideClickTimeout();
    settingsBtn = null;
    settingsDropdown = null;
    container.textContent = '';

    const popup = el('div', 'tw-popup');
    popupEl = popup;
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

    header.appendChild(el('span', 'tw-popup-title', msg('deals')));

    const headerActions = el('div', 'tw-popup-header-actions');

    if (showSettings) {
      const settingsButton = el('button', 'tw-popup-settings-btn', msg('settings')) as HTMLButtonElement;
      settingsBtn = settingsButton;
      settingsButton.title = msg('settings');
      settingsButton.innerHTML += ` ${SETTINGS_ICON}`;
      settingsButton.addEventListener('click', () => {
        setSettingsOpen(!settingsOpen);
      });
      headerActions.appendChild(settingsButton);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tw-popup-close-btn';
    closeBtn.title = closeTitle;
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.addEventListener('click', () => {
      trackTempleDealsEvent(TEMPLE_DEALS_EVENTS.popupClose, { domain });
      onClose();
    });
    headerActions.appendChild(closeBtn);

    header.appendChild(headerActions);

    return header;
  }

  function renderSettingsDropdown() {
    const dropdown = el('div', 'tw-popup-settings-dropdown');
    settingsDropdown = dropdown;

    const snoozeBtn = document.createElement('button');
    snoozeBtn.className = 'tw-popup-dropdown-item';
    snoozeBtn.appendChild(createDropdownIcon(SNOOZE_ICON_SVG, '#1373E4'));
    snoozeBtn.appendChild(document.createTextNode(` ${msg('snoozeFor24h')}`));
    snoozeBtn.addEventListener('click', async () => {
      trackTempleDealsEvent(TEMPLE_DEALS_EVENTS.popupSnooze, { domain });
      await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferSnooze });
      onSettingsChange?.();
      onClose();
    });
    dropdown.appendChild(snoozeBtn);

    const disableBtn = document.createElement('button');
    disableBtn.className = 'tw-popup-dropdown-item';
    disableBtn.appendChild(createDropdownIcon(DISABLE_ICON_SVG, '#FF3B30'));
    const disableText = el('span', '', msg('disable'));
    disableText.style.color = '#FF3B30';
    disableBtn.appendChild(document.createTextNode(' '));
    disableBtn.appendChild(disableText);
    disableBtn.addEventListener('click', async () => {
      trackTempleDealsEvent(TEMPLE_DEALS_EVENTS.popupDisable, { domain });
      await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferDisable });
      onSettingsChange?.();
      onClose();
    });
    dropdown.appendChild(disableBtn);

    const onOutsideClick = (e: Event) => {
      if (!dropdown.contains(e.target as Node) && !settingsBtn?.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    outsideClickTimeout = window.setTimeout(() => {
      outsideClickTimeout = null;
      shadow.addEventListener('click', onOutsideClick);
      cleanupOutsideClick = () => shadow.removeEventListener('click', onOutsideClick);
    });

    return dropdown;
  }

  function setSettingsOpen(open: boolean) {
    if (settingsOpen === open) return;

    settingsOpen = open;
    settingsBtn?.classList.toggle('tw-popup-settings-btn-open', settingsOpen);

    if (settingsOpen) {
      popupEl?.appendChild(renderSettingsDropdown());
      return;
    }

    cleanupOutsideClick?.();
    cleanupOutsideClick = null;
    clearOutsideClickTimeout();
    settingsDropdown?.remove();
    settingsDropdown = null;
  }

  function clearOutsideClickTimeout() {
    if (outsideClickTimeout === null) return;

    window.clearTimeout(outsideClickTimeout);
    outsideClickTimeout = null;
  }

  function renderBody() {
    const body = el('div', 'tw-popup-body');

    body.appendChild(renderOfferCard());
    body.appendChild(renderActivateButton());

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
    offerInfo.appendChild(el('div', 'tw-popup-offer-title', getOfferTitle(offer)));

    const descEl = el(
      'div',
      showMoreExpanded ? 'tw-popup-offer-desc' : 'tw-popup-offer-desc tw-popup-offer-desc-clamped',
      offerDescription
    );
    offerInfo.appendChild(descEl);

    requestAnimationFrame(() => {
      if (!descEl.isConnected) return;

      const isOverflowing = descEl.scrollHeight > descEl.clientHeight;

      if (showMoreExpanded || isOverflowing) {
        const toggle = el(
          'button',
          'tw-popup-show-more',
          msg(showMoreExpanded ? 'showLess' : 'showMore')
        ) as HTMLButtonElement;

        toggle.addEventListener('click', () => {
          showMoreExpanded = !showMoreExpanded;
          descEl.classList.toggle('tw-popup-offer-desc-clamped', !showMoreExpanded);
          toggle.textContent = msg(showMoreExpanded ? 'showLess' : 'showMore');
        });
        offerInfo.appendChild(toggle);
      }
    });

    offerCard.appendChild(offerInfo);

    return offerCard;
  }

  function renderActivateButton() {
    const activateBtn = document.createElement('button');
    activateBtn.className = 'tw-popup-activate-btn';
    activateBtn.textContent = activateText;
    activateBtn.addEventListener('click', async () => {
      activateBtn.textContent = msg('activating');
      activateBtn.disabled = true;

      try {
        const result = await browser.runtime.sendMessage({
          type: ContentScriptType.ActivateMerchantOffer,
          url: activationUrl
        });

        if (!result?.trackingLink) {
          activateBtn.textContent = activateText;
          activateBtn.disabled = false;
          return;
        }

        trackTempleDealsEvent(
          getOfferActivationEvent(offer, activationSource),
          getOfferAnalyticsProperties(offer, domain)
        );
        await browser.runtime
          .sendMessage({
            type: ContentScriptType.ReferralClick,
            urlDomain: domain,
            pageDomain,
            provider: 'TakeAds'
          })
          .catch(() => {});
        await suppressTempleDealPopup(domain);

        window.location.href = result.trackingLink;
      } catch (err) {
        console.error('Failed to activate merchant offer:', err);
        activateBtn.textContent = activateText;
        activateBtn.disabled = false;
      }
    });

    return activateBtn;
  }

  render();
}
