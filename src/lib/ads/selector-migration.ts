import browser from 'webextension-polyfill';

import { AD_CAMPAIGN_POLICY_STORAGE_KEY, AD_SELECTORS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

import { importExtensionAdsModule } from './import-extension-ads-module';
import { SelectorStorage } from './selector-feeds';
import { compileSelectorStorage, getOfflineSelectorStorage } from './selector-snapshot';

export const migrateAdSelectorStorage = async (): Promise<SelectorStorage> => {
  const stored = await fetchFromStorage<SelectorStorage>(AD_SELECTORS_STORAGE_KEY);
  const { SELECTOR_SCHEMA_VERSION, SELECTOR_PARSER_VERSION } = await importExtensionAdsModule();
  if (
    stored?.migrationVersion === 1 &&
    stored.snapshot?.schemaVersion === SELECTOR_SCHEMA_VERSION &&
    stored.snapshot.parserVersion === SELECTOR_PARSER_VERSION
  ) {
    const current = await compileSelectorStorage(stored.feeds);
    await browser.storage.local.remove('ALL_ADS_RULES');
    return current;
  }
  const initial = await getOfflineSelectorStorage();
  const legacy = await fetchFromStorage<{ blacklistedHypelabCampaignsSlugs?: string[] }>('ALL_ADS_RULES');
  const policy = await fetchFromStorage(AD_CAMPAIGN_POLICY_STORAGE_KEY);
  await browser.storage.local.set({
    [AD_SELECTORS_STORAGE_KEY]: initial,
    ...(!policy && legacy?.blacklistedHypelabCampaignsSlugs
      ? {
          [AD_CAMPAIGN_POLICY_STORAGE_KEY]: {
            blacklistedHypelabCampaignsSlugs: legacy.blacklistedHypelabCampaignsSlugs,
            timestamp: 0
          }
        }
      : {})
  });
  // Remove legacy data only after the complete replacement snapshot exists.
  await browser.storage.local.remove('ALL_ADS_RULES');
  return initial;
};
