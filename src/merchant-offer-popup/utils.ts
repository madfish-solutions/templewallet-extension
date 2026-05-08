import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';

export const ACTIVATED_KEY_PREFIX = 'temple-merchant-offer-activated:';

export const msg = (key: string, substitutions?: string | string[]) =>
  browser.i18n.getMessage(key, substitutions) || key;

export function trackMerchantOfferEvent(event: string, properties?: object) {
  browser.runtime
    .sendMessage({
      type: ContentScriptType.MerchantOfferAnalytics,
      event,
      properties
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
    : msg('merchantOfferPopupActivateDescription', offer.name);
}

export function formatBountyValue(value: number, currencyCode: string) {
  const formatted =
    value >= 1
      ? value.toFixed(2)
      : value >= 0.01
        ? value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
        : value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');

  return `${formatted} ${currencyCode}`;
}

export async function markMerchantOfferActivated(domain: string) {
  sessionStorage.setItem(`${ACTIVATED_KEY_PREFIX}${domain}`, '1');
  await browser.runtime
    .sendMessage({
      type: ContentScriptType.MarkMerchantOfferActivated,
      domain
    })
    .catch(() => {});
}

export async function wasMerchantOfferActivated(domain: string) {
  if (sessionStorage.getItem(`${ACTIVATED_KEY_PREFIX}${domain}`)) return true;

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
