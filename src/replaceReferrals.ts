import { checkIfShouldReplaceReferrals } from 'content-scripts/utils';
import { importExtensionAdsReferralsModule } from 'lib/ads/import-extension-ads-module';
import type { ReferralsRulesResponse } from 'lib/apis/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import { throttleAsyncCalls } from 'lib/utils/functions';

let interval: NodeJS.Timer;

checkIfShouldReplaceReferrals().then(shouldReplace => {
  if (!shouldReplace) return;

  replaceReferrals().catch(err => {
    // Most likely anchors haven't appeared on the page yet - will retry shortly
    console.error('Initial referrals processing errored:', err);
    setTimeout(replaceReferrals, 2_000);
  });

  interval = setInterval(replaceReferrals, 5_000);
});

const replaceReferrals = throttleAsyncCalls(async () => {
  const { getCurrentPageDomain, processAnchors } = await importExtensionAdsReferralsModule();

  const {
    domains: supportedDomains,
    textIconRules,
    redirectUrl
  }: ReferralsRulesResponse = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferralsRules
  });

  if (!supportedDomains.length) {
    console.warn('No supported domains');
    clearInterval(interval);
    return;
  }

  const currentPageDomain = getCurrentPageDomain();

  if (supportedDomains.some(d => d === currentPageDomain)) {
    console.warn('Host should not be of supported referral');
    clearInterval(interval);
    return;
  }

  console.log('Replacing referrals for', supportedDomains.length, 'domains ...');

  return processAnchors(new Set(supportedDomains), textIconRules, ContentScriptType, redirectUrl);
});
