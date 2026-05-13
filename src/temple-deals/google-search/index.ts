import { TEMPLE_ICON } from 'content-scripts/constants';
import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

import { injectTempleDealsPopupFont, mountTempleDealsPopup } from '../popup/layout';
import { formatBountyValue, isGoogleSearchPage, normalizeDomain, TEMPLE_DEALS_EVENTS } from '../utils';

const LABEL_CLASS = 'temple-google-deal-label';
const PROCESSED_ATTR = 'data-temple-google-deal';
const LABEL_GAP = 16;
const POPUP_LABEL_GAP = 8;
const POPUP_BOTTOM_SPACE_BUFFER = 30;
const DEFAULT_DELAY = 180;
const GOOGLE_SEARCH_FONT_TEXT = ' Bounty≈.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const scanCache = new WeakSet<Element>();
const offersCache = new Map<string, MerchantOffer | null>();
const pendingLabelsByDomain = new Map<string, PendingLabel[]>();

let hoverHost: HTMLDivElement | null = null;
let showHoverTimeout: number | null = null;
let hideHoverTimeout: number | null = null;
let offersFlushTimeout: number | null = null;

interface PendingLabel {
  root: Element;
  anchor: HTMLAnchorElement;
  moreButton: HTMLElement | null;
  url: string;
  domain: string;
}

if (window.self === window.top && isGoogleSearchPage()) {
  injectStyles();
  scanResults();

  const observer = new MutationObserver(() => scanResults());
  observer.observe(document.body, { childList: true, subtree: true });
}

function injectStyles() {
  injectTempleDealsPopupFont();

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = `https://fonts.googleapis.com/css2?family=Rubik:wght@500&display=swap&text=${encodeURIComponent(
    GOOGLE_SEARCH_FONT_TEXT
  )}`;
  document.head.appendChild(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    .${LABEL_CLASS} {
      align-items: center;
      background: rgba(255, 91, 0, 0.15);
      border: 0;
      border-radius: 4px;
      color: #FF5B00;
      cursor: pointer;
      display: inline-flex;
      font-family: Rubik, Arial, sans-serif;
      font-size: 12px;
      font-weight: 500;
      gap: 4px;
      line-height: 16px;
      opacity: 0;
      padding: 4px 8px 4px 4px;
      position: relative;
      transform: translateY(4px);
      transition: opacity 160ms ease, transform 160ms ease, background 120ms ease;
      white-space: nowrap;
    }

    .${LABEL_CLASS}-icon {
      display: block;
      height: 16px;
      width: 16px;
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
      z-index: 110;
    }

    .temple-google-deal-popup-host-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .temple-google-deal-popup-host-above {
      transform: translateY(-6px);
    }
  `;
  document.documentElement.appendChild(style);
}

function scanResults() {
  for (const title of document.querySelectorAll('a h3')) {
    if (scanCache.has(title)) continue;
    scanCache.add(title);

    const anchor = title.closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.hasAttribute(PROCESSED_ATTR)) continue;

    const targetUrl = getTargetUrl(anchor);
    if (!targetUrl) continue;

    const moreButton = findMoreButtonForTitle(title);
    const resultRoot = getResultRoot(anchor, moreButton);

    queueLabel({ root: resultRoot, anchor, moreButton, url: targetUrl.url, domain: targetUrl.domain });
  }
}

function findMoreButtonForTitle(title: Element) {
  if (title.id) {
    const describedBySelector = `[aria-label="About this result"][aria-describedby="${CSS.escape(title.id)}"]`;
    const describedByButton = document.querySelector<HTMLElement>(describedBySelector);
    if (describedByButton) return describedByButton;
  }

  const nearbyRoot = title.closest('div:has([aria-label="About this result"]), div:has([aria-label="More options"])');

  return (
    nearbyRoot?.querySelector<HTMLElement>('[aria-label="About this result"]') ??
    nearbyRoot?.querySelector<HTMLElement>('[aria-label="More options"]') ??
    null
  );
}

function getResultRoot(anchor: HTMLAnchorElement, moreButton: HTMLElement | null) {
  return moreButton ? getCommonAncestor(anchor, moreButton) : anchor;
}

function getCommonAncestor(first: Element, second: Element) {
  let ancestor: Element | null = first;

  while (ancestor) {
    if (ancestor.contains(second)) return ancestor;
    ancestor = ancestor.parentElement;
  }

  return first;
}

function getTargetUrl(anchor: HTMLAnchorElement) {
  try {
    const href = new URL(anchor.href);
    const url =
      href.hostname.endsWith('google.com') && href.pathname === '/url'
        ? new URL(href.searchParams.get('q') ?? '')
        : href;
    if (!/^https?:$/.test(url.protocol) || url.hostname.includes('google.')) return null;

    return {
      url: url.href,
      domain: normalizeDomain(url.hostname)
    };
  } catch {
    return null;
  }
}

function queueLabel(label: PendingLabel) {
  label.root.setAttribute(PROCESSED_ATTR, 'pending');
  label.anchor.setAttribute(PROCESSED_ATTR, 'pending');

  if (offersCache.has(label.domain)) {
    renderPendingLabel(label, offersCache.get(label.domain) ?? null);
    return;
  }

  const pendingLabels = pendingLabelsByDomain.get(label.domain) ?? [];
  pendingLabels.push(label);
  pendingLabelsByDomain.set(label.domain, pendingLabels);
  scheduleOffersFlush();
}

function scheduleOffersFlush() {
  if (offersFlushTimeout) return;
  offersFlushTimeout = window.setTimeout(() => {
    offersFlushTimeout = null;
    flushPendingOffers();
  });
}

async function flushPendingOffers() {
  const domains = [...pendingLabelsByDomain.keys()].filter(domain => !offersCache.has(domain));
  if (!domains.length) return;

  let offers: MerchantOffer[] = [];
  try {
    offers = await browser.runtime.sendMessage({
      type: ContentScriptType.FetchMerchantOffers,
      domains
    });
  } catch {
    offers = [];
  }

  const offersByDomain = new Map(offers.map(offer => [normalizeDomain(offer.domain), offer]));
  domains.forEach(domain => offersCache.set(domain, offersByDomain.get(domain) ?? null));

  domains.forEach(domain => {
    const pendingLabels = pendingLabelsByDomain.get(domain) ?? [];
    pendingLabelsByDomain.delete(domain);

    pendingLabels.forEach(label => renderPendingLabel(label, offersCache.get(domain) ?? null));
  });
}

function renderPendingLabel({ root, anchor, moreButton, url, domain }: PendingLabel, offer: MerchantOffer | null) {
  if (!offer) {
    root.removeAttribute(PROCESSED_ATTR);
    anchor.removeAttribute(PROCESSED_ATTR);
    return;
  }

  if (root.getAttribute(PROCESSED_ATTR) === 'ready') return;

  root.setAttribute(PROCESSED_ATTR, 'ready');
  anchor.setAttribute(PROCESSED_ATTR, 'ready');
  addLabel(anchor, moreButton, url, domain, offer);
}

function addLabel(anchor: HTMLAnchorElement, moreButton: HTMLElement | null, url: string, domain: string, offer: MerchantOffer) {
  const label = document.createElement('button');
  label.className = LABEL_CLASS;
  label.type = 'button';
  label.dataset.templeDomain = domain;
  label.dataset.templeRoot = '';

  const icon = document.createElement('img');
  icon.className = `${LABEL_CLASS}-icon`;
  icon.src = TEMPLE_ICON;
  icon.alt = '';
  label.appendChild(icon);
  label.appendChild(document.createTextNode(`Bounty \u2248 ${formatBountyValue(offer.cpcRate, offer.currencyCode)}`));

  const show = () => scheduleShowHoverPopup(label, offer, url, domain);
  label.addEventListener('mouseenter', show);
  label.addEventListener('focus', () => showHoverPopup(label, offer, url, domain));
  label.addEventListener('mouseleave', scheduleHideHoverPopup);
  label.addEventListener('blur', scheduleHideHoverPopup);

  placeLabel(anchor, moreButton, label);
  requestAnimationFrame(() => label.classList.add('temple-google-deal-label-visible'));
}

function placeLabel(anchor: HTMLAnchorElement, moreButton: HTMLElement | null, label: HTMLElement) {
  const labelHost = moreButton?.parentElement?.parentElement ?? moreButton?.parentElement;

  if (moreButton && labelHost) {
    const moreButtonWidth = moreButton.getBoundingClientRect().width || 18;
    label.style.marginLeft = `${moreButtonWidth + LABEL_GAP}px`;
    labelHost.appendChild(label);
    labelHost.style.display = 'inline-flex';
    labelHost.style.alignItems = 'center';
    return;
  }

  anchor.insertAdjacentElement('afterend', label);
}

function scheduleShowHoverPopup(label: HTMLElement, offer: MerchantOffer, url: string, domain: string) {
  if (hideHoverTimeout) {
    window.clearTimeout(hideHoverTimeout);
    hideHoverTimeout = null;
  }

  clearPendingShowHoverPopup();
  showHoverTimeout = window.setTimeout(() => {
    showHoverTimeout = null;
    showHoverPopup(label, offer, url, domain);
  }, DEFAULT_DELAY);
}

function showHoverPopup(label: HTMLElement, offer: MerchantOffer, url: string, domain: string) {
  clearPendingShowHoverPopup();

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

  mountTempleDealsPopup(hoverHost, {
    offer,
    domain,
    activationUrl: url,
    pageDomain: normalizeDomain(window.location.hostname),
    activateEvent: TEMPLE_DEALS_EVENTS.tagActivateBounty,
    onClose: () => {
      hoverHost?.remove();
      hoverHost = null;
    }
  });

  const labelRect = label.getBoundingClientRect();
  placeHoverPopup(hoverHost, labelRect);

  requestAnimationFrame(() => hoverHost?.classList.add('temple-google-deal-popup-host-visible'));
}

function placeHoverPopup(popup: HTMLElement, labelRect: DOMRect) {
  const popupRect = popup.getBoundingClientRect();
  const shouldShowAbove = window.innerHeight - labelRect.bottom < popupRect.height + POPUP_BOTTOM_SPACE_BUFFER;
  const top = shouldShowAbove
    ? Math.max(window.scrollY + POPUP_LABEL_GAP, labelRect.top + window.scrollY - popupRect.height - POPUP_LABEL_GAP)
    : labelRect.bottom + window.scrollY + POPUP_LABEL_GAP;

  popup.classList.toggle('temple-google-deal-popup-host-above', shouldShowAbove);
  popup.style.top = `${top}px`;
  popup.style.left = `${Math.max(POPUP_LABEL_GAP, labelRect.left + window.scrollX)}px`;
}

function scheduleHideHoverPopup() {
  clearPendingShowHoverPopup();

  if (hideHoverTimeout) window.clearTimeout(hideHoverTimeout);
  hideHoverTimeout = window.setTimeout(() => {
    hoverHost?.remove();
    hoverHost = null;
  }, DEFAULT_DELAY);
}

function clearPendingShowHoverPopup() {
  if (!showHoverTimeout) return;

  window.clearTimeout(showHoverTimeout);
  showHoverTimeout = null;
}
