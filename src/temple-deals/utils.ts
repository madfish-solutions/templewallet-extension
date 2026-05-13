import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

export const TEMPLE_DEALS_ACTIVATED_KEY_PREFIX = 'temple-merchant-offer-activated:';

export const TEMPLE_DEALS_EVENTS = {
  cpcWidgetView: 'Deals CPC Widget / View',
  tagActivateBounty: 'Deals Tag / Activate Bounty',
  popupActivateBounty: 'Deals Pop-up / Activate Bounty',
  popupClose: 'Deals Pop-up / Close',
  popupSnooze: 'Deals Pop-up / Snooze',
  popupDisable: 'Deals Pop-up / Disable'
} as const;

export const msg = (key: string, substitutions?: string | string[]) =>
  browser.i18n.getMessage(key, substitutions) || key;

export function trackTempleDealsEvent(event: string, properties?: object, category: "General" | "ButtonPress" = "ButtonPress") {
  browser.runtime
    .sendMessage({
      type: ContentScriptType.MerchantOfferAnalytics,
      event,
      properties,
      category
    })
    .catch(() => {});
}

export function el(tag: string, className: string, text?: string) {
  const elem = document.createElement(tag);
  if (className) elem.className = className;
  if (text) elem.textContent = text;

  return elem;
}

export function stripSubdomain(hostname: string, subdomain: string) {
  if (hostname.startsWith(`${subdomain}.`)) {
    return hostname.slice(subdomain.length + 1);
  }

  return hostname;
}

export function normalizeDomain(hostname: string) {
  return stripSubdomain(hostname.toLowerCase(), 'www');
}

export function getOfferDescription(offer: MerchantOffer) {
  return offer.description && offer.description.trim().split(/\s+/).length > 3
    ? offer.description
    : msg('templeDealActivateDescription', offer.name);
}

export function formatBountyValue(value: number, currencyCode: string) {
  return `${Math.max(value, 0.01).toFixed(2)} ${currencyCode}`;
}

export async function markTempleDealActivated(domain: string) {
  sessionStorage.setItem(`${TEMPLE_DEALS_ACTIVATED_KEY_PREFIX}${domain}`, '1');
  await browser.runtime
    .sendMessage({
      type: ContentScriptType.MarkMerchantOfferActivated,
      domain
    })
    .catch(() => {});
}

export async function wasTempleDealActivated(domain: string) {
  if (sessionStorage.getItem(`${TEMPLE_DEALS_ACTIVATED_KEY_PREFIX}${domain}`)) return true;

  try {
    return Boolean(
      await browser.runtime.sendMessage({
        type: ContentScriptType.CheckAndConsumeMerchantOfferActivated,
        domain
      })
    );
  } catch {
    return false;
  }
}

export function isGoogleSearchPage() {
  return /^www\.google\./.test(window.location.hostname) && window.location.pathname === '/search';
}
