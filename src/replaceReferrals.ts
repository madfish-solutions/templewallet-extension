import { checkIfShouldReplaceTempleReferrals } from 'content-scripts/utils';
import { importExtensionAdsReferralsModule } from 'lib/ads/import-extension-ads-module';
import type { ReferralsRulesResponse, TempleReferralLinkItem } from 'lib/apis/ads-api/ads-api';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import { throttleAsyncCalls } from 'lib/utils/functions';

let interval: NodeJS.Timeout;

let stopTempleReplacement = false;

(async () => {
  const shouldReplaceTemple = await checkIfShouldReplaceTempleReferrals();

  if (!shouldReplaceTemple) return;

  const callback = throttleAsyncCalls(async () => {
    if (stopTempleReplacement) {
      clearInterval(interval);
      return;
    }

    await replaceTempleReferrals();
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
