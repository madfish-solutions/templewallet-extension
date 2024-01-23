export enum ContentScriptType {
  ExternalLinksActivity = 'ExternalLinksActivity',
  ExternalAdsActivity = 'ExternalAdsActivity',
  UpdateSliseAdsRules = 'UpdateSliseAdsRules'
}

export const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

export const ACCOUNT_PKH_STORAGE_KEY = 'account_publickeyhash';

export const ALL_SLISE_ADS_RULES_STORAGE_KEY = 'ALL_SLISE_ADS_RULES';

export const SLISE_ADS_RULES_UPDATE_INTERVAL = 60 * 1000;

export const AD_HIDING_TIMEOUT = 12 * 3600 * 1000;

export const SLISE_PUBLISHER_ID = 'pub-25';

const isMacOS = /Mac OS/.test(navigator.userAgent);
export const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;
