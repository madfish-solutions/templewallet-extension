import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { ADS_META_SEARCH_PARAM_NAME, ORIGIN_SEARCH_PARAM_NAME } from 'lib/constants';

import { getRulesFromStorage } from './ads-rules';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const origin = usp.get(ORIGIN_SEARCH_PARAM_NAME) ?? window.location.href;
const adsMetadataIds = usp.getAll(ADS_META_SEARCH_PARAM_NAME).map(value => JSON.parse(value));

configureAds()
  .then(() => importExtensionAdsModule())
  .then(async ({ renderAdsStack }) => ({ renderAdsStack, rules: await getRulesFromStorage(origin) }))
  .then(({ renderAdsStack, rules }) =>
    renderAdsStack(id ?? '', adsMetadataIds, origin, rules.blacklistedHypelabCampaignsSlugs)
  )
  .catch(error => console.error(error));
