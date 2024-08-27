import { checkIfShouldReplaceAds, throttleAsyncCalls } from 'content-scripts/utils';
import { importExtensionAdsReferralsModule } from 'lib/ads/import-extension-ads-module';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

let interval: NodeJS.Timer;

checkIfShouldReplaceAds().then(shouldReplace => {
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

  const supportedDomains: string[] = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferralsSupportedDomains
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

  return processAnchors(new Set(supportedDomains), ContentScriptType);
});
