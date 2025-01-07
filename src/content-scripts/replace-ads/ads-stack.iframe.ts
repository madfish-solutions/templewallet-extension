import { configureAds } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import {
  ADS_META_SEARCH_PARAM_NAME,
  AD_CATEGORIES_PARAM_NAME,
  FONT_SIZE_SEARCH_PARAM_NAME,
  LINE_HEIGHT_SEARCH_PARAM_NAME,
  ORIGIN_SEARCH_PARAM_NAME,
  THEME_COLOR_SEARCH_PARAM_NAME
} from 'lib/constants';

import { getRulesFromStorage } from './ads-rules';

const usp = new URLSearchParams(window.location.search);
const id = usp.get('id');
const rawThemeColor = usp.get(THEME_COLOR_SEARCH_PARAM_NAME);
const rawFontSize = usp.get(FONT_SIZE_SEARCH_PARAM_NAME);
const rawLineHeight = usp.get(LINE_HEIGHT_SEARCH_PARAM_NAME);
const origin = usp.get(ORIGIN_SEARCH_PARAM_NAME) ?? window.location.href;
const adsMetadataIds = usp.getAll(ADS_META_SEARCH_PARAM_NAME).map(value => JSON.parse(value));
const adCategories = usp.getAll(AD_CATEGORIES_PARAM_NAME);

configureAds()
  .then(() => importExtensionAdsModule())
  .then(async ({ renderAdsStack }) => ({ renderAdsStack, rules: await getRulesFromStorage(origin) }))
  .then(({ renderAdsStack, rules }) => {
    const { blacklistedHypelabCampaignsSlugs, permanentAdPlacesRules, adPlacesRules } = rules;

    renderAdsStack({
      id: id ?? '',
      initialAdsMetadata: adsMetadataIds,
      origin,
      pageHasPlacesRules: permanentAdPlacesRules.length > 0 || adPlacesRules.length > 0,
      adCategories,
      hypelabBlacklistedCampaignsSlugs: blacklistedHypelabCampaignsSlugs,
      themeColor: rawThemeColor ?? undefined,
      fontSize: rawFontSize ? Number(rawFontSize) : undefined,
      lineHeight: rawLineHeight ? Number(rawLineHeight) : undefined
    });
  })
  .catch(error => console.error(error));
