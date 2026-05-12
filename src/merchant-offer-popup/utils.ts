import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

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
