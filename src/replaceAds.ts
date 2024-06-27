import axios from 'axios';
import browser from 'webextension-polyfill';

import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ContentScriptType, ADS_RULES_UPDATE_INTERVAL, WEBSITES_ANALYTICS_ENABLED } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

import { getRulesFromContentScript, clearRulesCache } from './content-scripts/replace-ads';

let processing = false;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

const getHeadBasedCategoryPrompt = () => {
  const tagsMetaElements = document.querySelectorAll('meta[name$="keywords"], meta[name$="tags"]');
  const tags = new Set(
    Array.from(tagsMetaElements)
      .map(metaElement => metaElement.getAttribute('content')?.toLowerCase())
      .filter(isNonEmptyString)
  );
  const tagsStr = Array.from(tags).join(', ');

  const allElements = document.querySelectorAll(
    'meta[property$="title"], meta[name$="title"], head > title, meta[name$="description"], meta[property$="description"]'
  );
  const candidates = Array.from(allElements)
    .map(element => (element instanceof HTMLMetaElement ? element.content : element.textContent))
    .concat(tagsStr)
    .filter(isNonEmptyString)
    .sort((a, b) => b.length - a.length);

  return candidates[0] ?? '';
};

const getURLBasedCategoryPrompt = () =>
  `${window.location.hostname} ${window.location.pathname.split('/').filter(Boolean).join('-').split('-').join(' ')}`;

const getFinalCategoryPrompt = () => `${getURLBasedCategoryPrompt()}\n${getHeadBasedCategoryPrompt()}`;

const replaceAds = async () => {
  if (processing) return;
  processing = true;

  try {
    const { getAdsActions, executeAdsActions } = await importExtensionAdsModule();
    const adsRules = await getRulesFromContentScript(window.location);

    if (adsRules.timestamp < Date.now() - ADS_RULES_UPDATE_INTERVAL) {
      clearRulesCache();
      browser.runtime.sendMessage({ type: ContentScriptType.UpdateAdsRules }).catch(e => console.error(e));
    }

    const adsActions = await getAdsActions(adsRules);

    const adsActionsResult = await executeAdsActions(adsActions);
    adsActionsResult.forEach(
      (result: PromiseSettledResult<void>) =>
        void (result.status === 'rejected' && console.error('Replacing an ad error:', result.reason))
    );
  } catch (error) {
    console.error('Replacing Ads error:', error);
  }

  processing = false;
};

// Prevents the script from running in an Iframe
if (window.frameElement === null) {
  fetchFromStorage<boolean>(WEBSITES_ANALYTICS_ENABLED)
    .then(async enabled => {
      if (!enabled) return;

      await configureAds();
      const categoryPrompt = await new Promise<string>(res => {
        const listener = () => {
          const prompt = getFinalCategoryPrompt();
          document.removeEventListener('readystatechange', listener);
          res(prompt);
        };

        if (document.readyState !== 'loading') {
          res(getFinalCategoryPrompt());
        } else {
          document.addEventListener('readystatechange', listener);
        }
      });
      console.log('category prompt', categoryPrompt);
      try {
        const { data } = await axios.post('http://localhost:3001/api/slise-ad-rules/ad-category', {
          prompt: categoryPrompt,
          urlExtract: `${window.location.hostname}${window.location.pathname}`
        });
        console.log('category result', data);
      } catch (e) {
        console.error(e);
      }
      // Replace ads with ours
      setInterval(() => replaceAds(), 1000);
    })
    .catch(console.error);
}
