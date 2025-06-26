import { checkIfShouldReplaceTakeAdsReferrals, checkIfShouldReplaceTempleReferrals } from 'content-scripts/utils';
import { importExtensionAdsReferralsModule } from 'lib/ads/import-extension-ads-module';
import type { ReferralsRulesResponse, TempleReferralLinkItem } from 'lib/apis/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import { throttleAsyncCalls } from 'lib/utils/functions';

let interval: NodeJS.Timer;

let stopTempleReplacement = false;
let stopTakeAdsReplacement = false;

(async () => {
  const shouldReplaceTemple = await checkIfShouldReplaceTempleReferrals();
  const shouldReplaceTakeAds = await checkIfShouldReplaceTakeAdsReferrals();

  const callback = throttleAsyncCalls(async () => {
    if (stopTempleReplacement && stopTakeAdsReplacement) {
      clearInterval(interval);
      return;
    }

    if (shouldReplaceTemple) await replaceTempleReferrals();
    if (shouldReplaceTakeAds) await replaceTakeAdsReferrals();
  });

  callback().catch(err => {
    // Most likely anchors haven't appeared on the page yet - will retry shortly
    console.error('Initial referrals processing errored:', err);
    setTimeout(callback, 2_000);
  });

  interval = setInterval(callback, 5_000);
})();

const replaceTempleReferrals = async () => {
  if (stopTempleReplacement) return;

  const { processTempleAnchors } = await importExtensionAdsReferralsModule();

  const linkItems: TempleReferralLinkItem[] = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchTempleReferralLinkItems
  });

  if (!linkItems.length) {
    console.warn('No supported links');
    stopTempleReplacement = true;
    return;
  }

  const { textIconRules }: ReferralsRulesResponse = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferralsRules
  });

  return processTempleAnchors(linkItems, textIconRules, ContentScriptType);
};

const replaceTakeAdsReferrals = async () => {
  if (stopTakeAdsReplacement) return;

  const { getCurrentPageDomain, processTakeAdsAnchors } = await importExtensionAdsReferralsModule();

  const {
    domains: supportedDomains,
    textIconRules,
    redirectUrl
  }: ReferralsRulesResponse = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferralsRules
  });

  if (!supportedDomains.length) {
    console.warn('No supported domains');
    stopTakeAdsReplacement = true;
    return;
  }

  const currentPageDomain = getCurrentPageDomain();

  if (supportedDomains.some(d => d === currentPageDomain)) {
    console.warn('Host should not be of supported referral');
    stopTakeAdsReplacement = true;
    return;
  }

  return processTakeAdsAnchors(new Set(supportedDomains), textIconRules, ContentScriptType, redirectUrl);
};
