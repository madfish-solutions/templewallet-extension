import { TEMPLE_ICON } from 'content-scripts/constants';
import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'lib/constants';

import { CLOSE_ICON } from 'merchant-offer-popup/icons';
import { getPopupStyles } from 'merchant-offer-popup/styles';
import {
  el,
  formatBountyValue,
  getOfferDescription,
  markMerchantOfferActivated,
  msg,
  normalizeDomain,
  trackMerchantOfferEvent
} from 'merchant-offer-popup/utils';

const LABEL_CLASS = 'temple-google-deal-label';
const PROCESSED_ATTR = 'data-temple-google-deal';
const LABEL_GAP = 24;
const HOVER_HIDE_DELAY = 180;
const scanCache = new WeakSet<Element>();
const offersCache = new Map<string, Promise<MerchantOffer | null>>();
const placements: Array<{ root: Element; anchor: HTMLAnchorElement; label: HTMLElement }> = [];

let hoverHost: HTMLDivElement | null = null;
let hideHoverTimeout: number | null = null;

if (window.self === window.top && isGoogleSearchPage()) {
  injectStyles();
  scanResults();

  const observer = new MutationObserver(() => scanResults());
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('resize', placeAllLabels, { passive: true });
  window.addEventListener('scroll', placeAllLabels, { passive: true });
}

function isGoogleSearchPage() {
  return /^www\.google\./.test(window.location.hostname) && window.location.pathname === '/search';
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .${LABEL_CLASS} {
      align-items: center;
      background: #5A2B10;
      border: 0;
      border-radius: 3px;
      color: #FF6B00;
      cursor: pointer;
      display: inline-flex;
      font-family: Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
      gap: 4px;
      height: 20px;
      line-height: 20px;
      opacity: 0;
      padding: 0 8px;
      position: absolute;
      transform: translateY(4px);
      transition: opacity 160ms ease, transform 160ms ease, background 120ms ease;
      white-space: nowrap;
      z-index: 2147483646;
    }

    .${LABEL_CLASS}::before {
      content: "\\1F3C6";
      font-size: 12px;
      line-height: 1;
    }

    .${LABEL_CLASS}:hover {
      background: #693212;
    }

    .${LABEL_CLASS}.temple-google-deal-label-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .temple-google-deal-popup-host {
      all: initial;
      opacity: 0;
      position: absolute;
      transform: translateY(6px);
      transition: opacity 160ms ease, transform 160ms ease;
      z-index: 2147483647;
    }

    .temple-google-deal-popup-host-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.documentElement.appendChild(style);
}

function scanResults() {
  for (const title of document.querySelectorAll('a h3')) {
    if (scanCache.has(title)) continue;
    scanCache.add(title);

    const anchor = title.closest<HTMLAnchorElement>('a[href]');
    const resultRoot = anchor?.closest('div[data-sokoban-container], div.g, div.MjjYud, div[data-ved]');
    if (!anchor || !resultRoot || resultRoot.hasAttribute(PROCESSED_ATTR)) continue;

    const targetUrl = getTargetUrl(anchor);
    if (!targetUrl) continue;

    resultRoot.setAttribute(PROCESSED_ATTR, 'pending');
    getOffer(targetUrl.domain).then(offer => {
      if (!offer || resultRoot.getAttribute(PROCESSED_ATTR) === 'ready') return;

      resultRoot.setAttribute(PROCESSED_ATTR, 'ready');
      addLabel(resultRoot, anchor, targetUrl.url, targetUrl.domain, offer);
    });
  }
}

function getTargetUrl(anchor: HTMLAnchorElement) {
  try {
    const href = new URL(anchor.href);
    const url = href.hostname.endsWith('google.com') && href.pathname === '/url' ? new URL(href.searchParams.get('q') ?? '') : href;
    if (!/^https?:$/.test(url.protocol) || url.hostname.includes('google.')) return null;

    return {
      url: url.href,
      domain: normalizeDomain(url.hostname)
    };
  } catch {
    return null;
  }
}

function getOffer(domain: string) {
  let cached = offersCache.get(domain);
  if (!cached) {
    cached = browser.runtime
      .sendMessage({
        type: ContentScriptType.FetchMerchantOffer,
        domain
      })
      .catch(() => null);
    offersCache.set(domain, cached);
  }

  return cached;
}

function addLabel(root: Element, anchor: HTMLAnchorElement, url: string, domain: string, offer: MerchantOffer) {
  const label = document.createElement('button');
  label.className = LABEL_CLASS;
  label.type = 'button';
  label.textContent = `Bounty \u2248 ${formatBountyValue(offer.cpcRate, offer.currencyCode)}`;
  label.dataset.templeDomain = domain;
  label.dataset.templeRoot = '';
  document.body.appendChild(label);
  placements.push({ root, anchor, label });

  const show = () => showHoverPopup(label, offer, url, domain);
  label.addEventListener('mouseenter', show);
  label.addEventListener('focus', show);
  label.addEventListener('mouseleave', scheduleHideHoverPopup);
  label.addEventListener('blur', scheduleHideHoverPopup);

  placeLabel(root, anchor, label);
  requestAnimationFrame(() => label.classList.add('temple-google-deal-label-visible'));
}

function placeAllLabels() {
  placements.forEach(({ root, anchor, label }) => placeLabel(root, anchor, label));
}

function placeLabel(root: Element, anchor: HTMLAnchorElement, label: HTMLElement) {
  const moreButton = findMoreButton(root);
  const referenceRect = moreButton?.getBoundingClientRect() ?? anchor.getBoundingClientRect();
  const labelRect = label.getBoundingClientRect();

  const top = referenceRect.top + window.scrollY + Math.max(0, (referenceRect.height - labelRect.height) / 2);
  const left = moreButton
    ? referenceRect.left + window.scrollX - labelRect.width - LABEL_GAP
    : referenceRect.right + window.scrollX + LABEL_GAP;

  label.style.top = `${top}px`;
  label.style.left = `${Math.max(0, left)}px`;
}

function findMoreButton(root: Element) {
  return (
    root.querySelector<HTMLElement>('[aria-label="More options"]') ??
    root.querySelector<HTMLElement>('[aria-label="About this result"]') ??
    root.querySelector<HTMLElement>('[role="button"][aria-haspopup="true"]')
  );
}

function showHoverPopup(label: HTMLElement, offer: MerchantOffer, url: string, domain: string) {
  if (hideHoverTimeout) {
    window.clearTimeout(hideHoverTimeout);
    hideHoverTimeout = null;
  }

  hoverHost?.remove();
  hoverHost = document.createElement('div');
  hoverHost.className = 'temple-google-deal-popup-host';
  hoverHost.addEventListener('mouseenter', () => {
    if (hideHoverTimeout) window.clearTimeout(hideHoverTimeout);
  });
  hoverHost.addEventListener('mouseleave', scheduleHideHoverPopup);
  document.body.appendChild(hoverHost);

  const shadow = hoverHost.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = getPopupStyles();
  shadow.appendChild(style);

  const popup = renderHoverPopup(offer, url, domain);
  shadow.appendChild(popup);

  const labelRect = label.getBoundingClientRect();
  hoverHost.style.top = `${labelRect.bottom + window.scrollY + 8}px`;
  hoverHost.style.left = `${Math.max(8, labelRect.left + window.scrollX)}px`;

  requestAnimationFrame(() => hoverHost?.classList.add('temple-google-deal-popup-host-visible'));
}

function scheduleHideHoverPopup() {
  if (hideHoverTimeout) window.clearTimeout(hideHoverTimeout);
  hideHoverTimeout = window.setTimeout(() => {
    hoverHost?.remove();
    hoverHost = null;
  }, HOVER_HIDE_DELAY);
}

function renderHoverPopup(offer: MerchantOffer, url: string, domain: string) {
  const container = el('div', 'tw-popup');

  const header = el('div', 'tw-popup-header');
  const templeIcon = document.createElement('img');
  templeIcon.className = 'tw-popup-temple-icon';
  templeIcon.src = TEMPLE_ICON;
  templeIcon.alt = '';
  header.appendChild(templeIcon);
  header.appendChild(el('span', 'tw-popup-title', msg('merchantOfferPopupTitle')));

  const closeBtn = document.createElement('button');
  closeBtn.className = 'tw-popup-btn-icon tw-popup-close-btn';
  closeBtn.title = 'Close';
  closeBtn.innerHTML = CLOSE_ICON;
  closeBtn.addEventListener('click', () => {
    trackMerchantOfferEvent('MerchantOfferGooglePopupClose', { domain });
    hoverHost?.remove();
    hoverHost = null;
  });
  header.appendChild(closeBtn);
  container.appendChild(header);

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
    el('div', 'tw-popup-offer-title', msg('merchantOfferPopupEarnUpTo', formatBountyValue(offer.cpcRate, offer.currencyCode).split(' ')))
  );
  offerInfo.appendChild(el('div', 'tw-popup-offer-desc', getOfferDescription(offer)));
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
        url
      });

      if (!result?.trackingLink) {
        activateBtn.textContent = msg('merchantOfferPopupActivate');
        activateBtn.disabled = false;
        return;
      }

      trackMerchantOfferEvent('MerchantOfferGooglePopupActivate', { domain });
      await browser.runtime
        .sendMessage({
          type: ContentScriptType.ReferralClick,
          urlDomain: domain,
          pageDomain: normalizeDomain(window.location.hostname),
          provider: 'TakeAds'
        })
        .catch(() => {});
      await markMerchantOfferActivated(domain);

      window.location.href = result.trackingLink;
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

  return container;
}
