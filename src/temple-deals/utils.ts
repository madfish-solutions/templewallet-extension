import type { MerchantOffer } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

export const TEMPLE_DEALS_POPUP_SUPPRESSION_TTL = 15 * 60 * 1000;
export const TEMPLE_DEALS_SUPPRESSED_KEY_PREFIX = 'temple-merchant-offer-suppressed:';

export const TEMPLE_DEALS_EVENTS = {
  cpcWidgetView: 'Deals CPC Widget / View',
  cpaWidgetView: 'Deals CPA Widget / View',
  tagActivateBounty: 'Deals Tag / Activate Bounty',
  tagActivateCashback: 'Deals Tag / Activate Cashback',
  popupActivateBounty: 'Deals Pop-up / Activate Bounty',
  popupActivateCashback: 'Deals Pop-up / Activate Cashback',
  popupClose: 'Deals Pop-up / Close',
  popupSnooze: 'Deals Pop-up / Snooze',
  popupDisable: 'Deals Pop-up / Disable'
} as const;

export type TempleDealsActivationSource = 'tag' | 'popup';

export const msg = (key: string, substitutions?: string | string[]) =>
  browser.i18n.getMessage(key, substitutions) || key;

export function trackTempleDealsEvent(
  event: string,
  properties?: object,
  category: 'General' | 'ButtonPress' = 'ButtonPress'
) {
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
    : msg(
        offer.rate.type === 'cpa' ? 'templeDealActivateCashbackDescription' : 'templeDealActivateBountyDescription',
        offer.name
      );
}

export function getOfferTitle(offer: MerchantOffer) {
  return msg(offer.rate.type === 'cpa' ? 'cashbackValue' : 'earnValue', formatRateValue(offer));
}

export function getOfferLabel(offer: MerchantOffer) {
  return offer.rate.type === 'cpa'
    ? msg('cashbackValue', formatRateValue(offer))
    : msg('bountyValueApprox', formatRateValue(offer));
}

export function getOfferActivateText(offer: MerchantOffer) {
  return msg(offer.rate.type === 'cpa' ? 'activateCashback' : 'activateBounty');
}

export function getOfferViewEvent(offer: MerchantOffer) {
  return offer.rate.type === 'cpa' ? TEMPLE_DEALS_EVENTS.cpaWidgetView : TEMPLE_DEALS_EVENTS.cpcWidgetView;
}

export function getOfferActivationEvent(offer: MerchantOffer, source: TempleDealsActivationSource) {
  if (source === 'tag') {
    return offer.rate.type === 'cpa'
      ? TEMPLE_DEALS_EVENTS.tagActivateCashback
      : TEMPLE_DEALS_EVENTS.tagActivateBounty;
  }

  return offer.rate.type === 'cpa'
    ? TEMPLE_DEALS_EVENTS.popupActivateCashback
    : TEMPLE_DEALS_EVENTS.popupActivateBounty;
}

export function getOfferAnalyticsProperties(offer: MerchantOffer, domain: string) {
  return offer.rate.type === 'cpa' ? { domain, cashbackTier: offer.rate.tier } : { domain };
}

function formatRateValue({ rate }: MerchantOffer) {
  if (rate.type === 'cpa') {
    return `${formatNumericRateValue(rate.value)}${rate.currency}`;
  }

  return `${formatNumericRateValue(rate.value, true)} ${rate.currency}`;
}

function formatNumericRateValue(value: string, forceFractionDigits = false) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return value;

  const safeValue = Math.max(numericValue, 0.01);

  return forceFractionDigits
    ? safeValue.toFixed(2)
    : safeValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export async function suppressTempleDealPopup(domain: string) {
  sessionStorage.setItem(`${TEMPLE_DEALS_SUPPRESSED_KEY_PREFIX}${domain}`, String(Date.now()));
  await browser.runtime
    .sendMessage({
      type: ContentScriptType.MarkMerchantOfferActivated,
      domain
    })
    .catch(() => {});
}

export async function isTempleDealPopupSuppressed(domain: string) {
  const storageKey = `${TEMPLE_DEALS_SUPPRESSED_KEY_PREFIX}${domain}`;
  const suppressedAt = Number(sessionStorage.getItem(storageKey));

  if (suppressedAt && Date.now() - suppressedAt < TEMPLE_DEALS_POPUP_SUPPRESSION_TTL) return true;
  sessionStorage.removeItem(storageKey);

  try {
    const suppressed = Boolean(
      await browser.runtime.sendMessage({
        type: ContentScriptType.CheckAndConsumeMerchantOfferActivated,
        domain
      })
    );

    if (suppressed) sessionStorage.setItem(storageKey, String(Date.now()));

    return suppressed;
  } catch {
    return false;
  }
}

export function isGoogleSearchPage() {
  return /^www\.google\./.test(window.location.hostname) && window.location.pathname === '/search';
}
