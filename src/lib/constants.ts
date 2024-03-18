export enum ContentScriptType {
  ExternalLinksActivity = 'ExternalLinksActivity',
  ExternalAdsActivity = 'ExternalAdsActivity',
  UpdateAdsRules = 'UpdateAdsRules'
}

export const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

export const ACCOUNT_PKH_STORAGE_KEY = 'account_publickeyhash';

export const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics_user_id';

export const ALL_ADS_RULES_STORAGE_KEY = 'ALL_ADS_RULES';

export const ADS_RULES_UPDATE_INTERVAL = 5 * 60 * 1000;

export const TEMPLE_WALLET_AD_ATTRIBUTE_NAME = 'twa';

export const AD_HIDING_TIMEOUT = 12 * 3600 * 1000;

export const AD_SEEN_THRESHOLD = 0.5;

export const TKEY_AD_PLACEMENT_SLUG = 'tkey_ad_placement';

const isMacOS = /Mac OS/.test(navigator.userAgent);
export const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;
