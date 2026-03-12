import { TEMPLE_ICON } from 'content-scripts/constants';
import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType, TERMS_OF_USE_URL, PRIVACY_POLICY_URL } from 'lib/constants';

const POPUP_HOST_ID = 'temple-merchant-offer-host';
const ACTIVATED_KEY_PREFIX = 'temple-merchant-offer-activated:';

const msg = (key: string, substitutions?: string | string[]) => browser.i18n.getMessage(key, substitutions) || key;

function trackMerchantOfferEvent(event: string, properties?: object) {
  browser.runtime
    .sendMessage({
      type: ContentScriptType.MerchantOfferAnalytics,
      event,
      properties
    })
    .catch(() => {});
}

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

function stripSubdomain(hostname: string, subdomain: string) {
  if (hostname.startsWith(`${subdomain}.`)) {
    return hostname.slice(subdomain.length + 1);
  }

  return hostname;
}

function injectPopup(offer: MerchantOffer, domain: string) {
  // Prevent duplicate injection
  if (document.getElementById(POPUP_HOST_ID)) return;

  // Load Inter font globally — @font-face in document scope is inherited by shadow DOM
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
    settingsBtn.innerHTML += ` <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 1.5L6.8 3.1C6.1 3.4 5.5 3.8 5 4.3L3.4 3.7L2 6.3L3.3 7.3C3.2 7.5 3.2 7.8 3.2 8C3.2 8.2 3.2 8.5 3.3 8.7L2 9.7L3.4 12.3L5 11.7C5.5 12.2 6.1 12.6 6.8 12.9L6.5 14.5H9.5L9.8 12.9C10.5 12.6 11 12.2 11.5 11.7L13.1 12.3L14.5 9.7L13.2 8.7C13.3 8.5 13.3 8.2 13.3 8C13.3 7.8 13.3 7.5 13.2 7.3L14.5 6.3L13.1 3.7L11.5 4.3C11 3.8 10.5 3.4 9.8 3.1L9.5 1.5H6.5Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2" fill="none"/>
    </svg>`;
    settingsBtn.addEventListener('click', () => {
      settingsOpen = !settingsOpen;
      render();
    });
    headerActions.appendChild(settingsBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tw-popup-btn-icon tw-popup-close-btn';
    closeBtn.title = 'Close';
    closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1L13 13M13 1L1 13" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
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
      snoozeBtn.innerHTML = `<svg class="tw-popup-dropdown-icon" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.6377 14.3281C6.11816 14.3281 5.66016 14.2096 5.26367 13.9727C4.87174 13.7402 4.55957 13.4326 4.32715 13.0498C4.09928 12.6715 3.97624 12.2614 3.95801 11.8193H1.14844C0.788411 11.8193 0.505859 11.7327 0.300781 11.5596C0.10026 11.3818 0 11.1471 0 10.8555C0 10.6139 0.0638021 10.3838 0.191406 10.165C0.31901 9.94173 0.480794 9.72754 0.676758 9.52246C0.877279 9.31738 1.08236 9.11458 1.29199 8.91406C1.4515 8.75911 1.57454 8.55632 1.66113 8.30566C1.74772 8.05501 1.8138 7.7793 1.85938 7.47852C1.90495 7.17773 1.94141 6.87012 1.96875 6.55566C1.97786 6.18652 2.00065 5.83789 2.03711 5.50977C2.07812 5.18164 2.13281 4.8763 2.20117 4.59375L3.37695 5.76953C3.35417 5.94271 3.33366 6.125 3.31543 6.31641C3.30176 6.50781 3.29264 6.70833 3.28809 6.91797C3.26986 7.22786 3.24251 7.51497 3.20605 7.7793C3.1696 8.04362 3.12174 8.28516 3.0625 8.50391C3.00326 8.72266 2.93034 8.91862 2.84375 9.0918C2.76172 9.26497 2.66374 9.41536 2.5498 9.54297C2.44043 9.67057 2.32422 9.7959 2.20117 9.91895C2.08268 10.0374 1.97331 10.1468 1.87305 10.2471C1.77734 10.3473 1.69987 10.4271 1.64062 10.4863V10.5684H8.18262L9.64551 12.0381H9.2832C9.23307 12.4528 9.08952 12.8333 8.85254 13.1797C8.62012 13.526 8.3125 13.804 7.92969 14.0137C7.55143 14.2233 7.12077 14.3281 6.6377 14.3281ZM6.6377 13.2344C7.02507 13.2344 7.34635 13.1068 7.60156 12.8516C7.85677 12.5964 7.99577 12.2523 8.01855 11.8193H5.25C5.27734 12.2523 5.41862 12.5964 5.67383 12.8516C5.92904 13.1068 6.25033 13.2344 6.6377 13.2344ZM3.65723 2.09863C3.79395 1.99382 3.93978 1.89811 4.09473 1.81152C4.25423 1.72493 4.42285 1.65202 4.60059 1.59277C4.72819 1.1416 4.97201 0.763346 5.33203 0.458008C5.69206 0.152669 6.12728 0 6.6377 0C7.14355 0 7.5765 0.152669 7.93652 0.458008C8.29655 0.763346 8.54264 1.1416 8.6748 1.59277C9.57259 1.91634 10.2266 2.51107 10.6367 3.37695C11.0514 4.24284 11.2793 5.36621 11.3203 6.74707C11.3385 7.02051 11.3659 7.27344 11.4023 7.50586C11.4388 7.73372 11.4867 7.94564 11.5459 8.1416C11.6097 8.33301 11.6895 8.51074 11.7852 8.6748C11.8854 8.83887 12.0062 8.99609 12.1475 9.14648C12.4163 9.40169 12.667 9.66602 12.8994 9.93945C13.1318 10.2129 13.248 10.5023 13.248 10.8076C13.248 11.0583 13.1706 11.2656 13.0156 11.4297L10.3018 8.6543C10.2288 8.49479 10.1719 8.32845 10.1309 8.15527C10.0944 7.97754 10.0648 7.78385 10.042 7.57422C10.0192 7.36458 9.9987 7.12988 9.98047 6.87012C9.96224 5.90853 9.8597 5.14518 9.67285 4.58008C9.486 4.01042 9.24219 3.58431 8.94141 3.30176C8.64062 3.01921 8.30339 2.8278 7.92969 2.72754C7.84766 2.70931 7.78385 2.67741 7.73828 2.63184C7.69271 2.58171 7.66536 2.51107 7.65625 2.41992C7.63802 2.07357 7.53776 1.79329 7.35547 1.5791C7.17773 1.36491 6.93848 1.25781 6.6377 1.25781C6.33691 1.25781 6.09538 1.36491 5.91309 1.5791C5.73079 1.79329 5.63053 2.07357 5.6123 2.41992C5.60775 2.51107 5.5804 2.58171 5.53027 2.63184C5.4847 2.67741 5.42318 2.70931 5.3457 2.72754C5.21354 2.764 5.08594 2.80957 4.96289 2.86426C4.8444 2.91895 4.73047 2.98503 4.62109 3.0625L3.65723 2.09863ZM0.25293 1.45605C0.152669 1.35124 0.102539 1.22363 0.102539 1.07324C0.102539 0.918294 0.152669 0.788411 0.25293 0.683594C0.362305 0.578776 0.492188 0.526367 0.642578 0.526367C0.797526 0.526367 0.927409 0.578776 1.03223 0.683594L13.4463 13.0908C13.5511 13.1956 13.6035 13.3232 13.6035 13.4736C13.6035 13.624 13.5511 13.7539 13.4463 13.8633C13.3415 13.9681 13.2116 14.0205 13.0566 14.0205C12.9062 14.0205 12.7786 13.9681 12.6738 13.8633L0.25293 1.45605Z" fill="#1373E4"/>
      </svg>`;
      snoozeBtn.appendChild(document.createTextNode(` ${msg('merchantOfferPopupSnooze')}`));
      snoozeBtn.addEventListener('click', async () => {
        trackMerchantOfferEvent('MerchantOfferPopupSnooze', { domain });
        await browser.runtime.sendMessage({ type: ContentScriptType.MerchantOfferSnooze });
        host.remove();
      });
      dropdown.appendChild(snoozeBtn);

      const disableBtn = document.createElement('button');
      disableBtn.className = 'tw-popup-dropdown-item tw-popup-dropdown-item-disable';
      disableBtn.innerHTML = `<svg class="tw-popup-dropdown-icon" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.06152 14.123C6.08626 14.123 5.17253 13.9385 4.32031 13.5693C3.4681 13.2048 2.71842 12.6989 2.07129 12.0518C1.42415 11.4092 0.916016 10.6618 0.546875 9.80957C0.182292 8.9528 0 8.03678 0 7.06152C0 6.08626 0.182292 5.17253 0.546875 4.32031C0.916016 3.46354 1.42415 2.71159 2.07129 2.06445C2.71842 1.41732 3.4681 0.911458 4.32031 0.546875C5.17253 0.182292 6.08626 0 7.06152 0C8.03678 0 8.95052 0.182292 9.80273 0.546875C10.6595 0.911458 11.4115 1.41732 12.0586 2.06445C12.7057 2.71159 13.2116 3.46354 13.5762 4.32031C13.9453 5.17253 14.1299 6.08626 14.1299 7.06152C14.1299 8.03678 13.9453 8.9528 13.5762 9.80957C13.2116 10.6618 12.7057 11.4092 12.0586 12.0518C11.4115 12.6989 10.6595 13.2048 9.80273 13.5693C8.95052 13.9385 8.03678 14.123 7.06152 14.123ZM7.06152 12.7285C7.84538 12.7285 8.5791 12.5804 9.2627 12.2842C9.94629 11.9925 10.5479 11.5869 11.0674 11.0674C11.5915 10.5479 11.9993 9.94629 12.291 9.2627C12.5827 8.5791 12.7285 7.84538 12.7285 7.06152C12.7285 6.27767 12.5827 5.54395 12.291 4.86035C11.9993 4.1722 11.5915 3.57064 11.0674 3.05566C10.5479 2.53613 9.94629 2.13053 9.2627 1.83887C8.5791 1.54264 7.84538 1.39453 7.06152 1.39453C6.28223 1.39453 5.5485 1.54264 4.86035 1.83887C4.17676 2.13053 3.5752 2.53613 3.05566 3.05566C2.53613 3.57064 2.12826 4.1722 1.83203 4.86035C1.54036 5.54395 1.39453 6.27767 1.39453 7.06152C1.39453 7.84538 1.54036 8.5791 1.83203 9.2627C2.12826 9.94629 2.53613 10.5479 3.05566 11.0674C3.5752 11.5869 4.17676 11.9925 4.86035 12.2842C5.5485 12.5804 6.28223 12.7285 7.06152 12.7285ZM7.06836 10.5957C6.58073 10.5957 6.12272 10.5023 5.69434 10.3154C5.26595 10.1286 4.8877 9.87337 4.55957 9.5498C4.236 9.22168 3.98079 8.8457 3.79395 8.42188C3.61165 7.99349 3.52051 7.53776 3.52051 7.05469C3.52051 6.57161 3.61849 6.10677 3.81445 5.66016C4.01042 5.20898 4.28385 4.82161 4.63477 4.49805C4.76237 4.375 4.89225 4.31803 5.02441 4.32715C5.16113 4.33626 5.27507 4.38867 5.36621 4.48438C5.45736 4.57552 5.50749 4.68945 5.5166 4.82617C5.52572 4.96289 5.46647 5.09277 5.33887 5.21582C5.08366 5.45736 4.8877 5.73535 4.75098 6.0498C4.61882 6.36426 4.55273 6.69922 4.55273 7.05469C4.55273 7.51953 4.66439 7.94336 4.8877 8.32617C5.111 8.70443 5.41178 9.00749 5.79004 9.23535C6.17285 9.45866 6.59896 9.57031 7.06836 9.57031C7.5332 9.57031 7.95475 9.45866 8.33301 9.23535C8.71582 9.00749 9.01888 8.70443 9.24219 8.32617C9.47005 7.94336 9.58398 7.51953 9.58398 7.05469C9.57943 6.69922 9.50879 6.36426 9.37207 6.0498C9.23535 5.73535 9.04167 5.45964 8.79102 5.22266C8.66341 5.09505 8.60189 4.96517 8.60645 4.83301C8.61556 4.69629 8.66569 4.58008 8.75684 4.48438C8.85254 4.38867 8.96875 4.33626 9.10547 4.32715C9.24219 4.31803 9.37207 4.375 9.49512 4.49805C9.84603 4.82617 10.1195 5.21582 10.3154 5.66699C10.5114 6.11361 10.6094 6.57617 10.6094 7.05469C10.6094 7.53776 10.516 7.99349 10.3291 8.42188C10.1423 8.8457 9.88704 9.22168 9.56348 9.5498C9.23991 9.87337 8.86393 10.1286 8.43555 10.3154C8.00716 10.5023 7.55143 10.5957 7.06836 10.5957ZM7.06836 7.23926C6.91341 7.23926 6.78809 7.19141 6.69238 7.0957C6.59668 7 6.54883 6.87467 6.54883 6.71973V3.84863C6.54883 3.68913 6.59668 3.56152 6.69238 3.46582C6.78809 3.36556 6.91341 3.31543 7.06836 3.31543C7.21419 3.31543 7.33496 3.36556 7.43066 3.46582C7.52637 3.56152 7.57422 3.68913 7.57422 3.84863V6.71973C7.57422 6.87467 7.52637 7 7.43066 7.0957C7.33496 7.19141 7.21419 7.23926 7.06836 7.23926Z" fill="#FF3B30"/>
      </svg>`;
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

function el(tag: string, className: string, text?: string) {
  const elem = document.createElement(tag);
  if (className) elem.className = className;
  if (text) elem.textContent = text;

  return elem;
}

function getPopupStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
    }

    .tw-popup {
      width: 360px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: visible;
      animation: tw-slide-in 0.3s ease-out;
    }

    @keyframes tw-slide-in {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tw-popup-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-bottom: 1px solid #F3F4F6;
      position: relative;
    }

    .tw-popup-temple-icon {
      width: 20px;
      height: 20px;
    }

    .tw-popup-title {
      font-size: 16px;
      font-weight: 600;
      color: #151618;
      flex: 1;
    }

    .tw-popup-header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .tw-popup-settings-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      background: rgba(19, 115, 228, 0.15);
      color: #1373E4;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .tw-popup-settings-btn:hover {
      background: rgba(19, 115, 228, 0.2);
    }

    .tw-popup-settings-btn-open {
      background: #F4F4F4;
      color: #707070;
    }

    .tw-popup-settings-btn-open:hover {
      background: #EBEBEB;
    }

    .tw-popup-btn-icon {
      width: 10px;
      height: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.15s;
    }

    .tw-popup-btn-icon:hover {
      background: #F3F4F6;
    }

    .tw-popup-settings-dropdown {
      position: absolute;
      right: 40px;
      top: 42px;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 10;
      border: 1px solid #E5E7EB;
    }

    .tw-popup-dropdown-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 14px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      color: #151618;
      width: 100%;
      text-align: left;
      white-space: nowrap;
      transition: background 0.15s;
    }

    .tw-popup-dropdown-icon {
      width: 16px;
      height: 16px;
      padding: 4px;
      box-sizing: content-box;
      flex-shrink: 0;
    }

    .tw-popup-dropdown-item-snooze {
      padding-bottom: 6px;
    }

    .tw-popup-dropdown-item-disable {
      padding-top: 6px;
    }

    .tw-popup-dropdown-item:hover {
      background: #F9FAFB;
    }

    .tw-popup-body {
      padding: 24px 16px 16px;
    }

    .tw-popup-offer-card {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .tw-popup-merchant-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: contain;
      flex-shrink: 0;
      background: #F9FAFB;
    }

    .tw-popup-merchant-icon-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #F3F4F6;
      flex-shrink: 0;
    }

    .tw-popup-offer-info {
      flex: 1;
      min-width: 0;
    }

    .tw-popup-offer-title {
      font-size: 16px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 4px;
    }

    .tw-popup-offer-desc {
      font-size: 12px;
      color: #707070;
      line-height: 1.4;
    }

    .tw-popup-offer-desc-clamped {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tw-popup-show-more {
      background: none;
      border: none;
      color: #1373E4;
      font-size: 12px;
      cursor: pointer;
      padding: 2px 0 0;
      font-weight: 500;
    }

    .tw-popup-show-more:hover {
      color: #2563EB;
    }

    .tw-popup-activate-btn {
      width: 100%;
      padding: 12px;
      background: #FF5B00;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .tw-popup-activate-btn:hover {
      background: #E65200;
    }

    .tw-popup-activate-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .tw-popup-disclaimer {
      margin-top: 24px;
      padding: 0 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      color: #9CA3AF;
      line-height: 1.4;
      text-align: center;
    }

    .tw-popup-disclaimer a {
      color: #9CA3AF;
      text-decoration: underline;
      font-weight: 600;
    }
  `;
}
