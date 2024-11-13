export enum ContentScriptType {
  ExternalLinksActivity = 'ExternalLinksActivity',
  ExternalAdsActivity = 'ExternalAdsActivity',
  UpdateAdsRules = 'UpdateAdsRules',
  FetchReferralsRules = 'FetchReferralsRules',
  FetchReferrals = 'FetchReferrals',
  ReferralClick = 'ReferralClick'
}

export const AD_CATEGORIES_PARAM_NAME = 'categories';

export const ORIGIN_SEARCH_PARAM_NAME = 'o';

export const ADS_META_SEARCH_PARAM_NAME = 'ads-meta';

export const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

export const REPLACE_REFERRALS_ENABLED = 'REPLACE_REFERRALS_ENABLED';

export const ACCOUNT_PKH_STORAGE_KEY = 'account_publickeyhash';

export const ADS_VIEWER_ADDRESS_STORAGE_KEY = 'ADS_VIEWER_ADDRESS';

export const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics_user_id';

export const ALL_ADS_RULES_STORAGE_KEY = 'ALL_ADS_RULES';

export const ADS_RULES_UPDATE_INTERVAL = 5 * 60 * 1000;

export const AD_HIDING_TIMEOUT = 12 * 3600 * 1000;

export const AD_SEEN_THRESHOLD = 0.5;

export const HYPELAB_STUB_CAMPAIGN_SLUG = 'e55d2795d2';

export const RECENT_TERMS_VERSION = 1;

export const TERMS_WITH_REFERRALS_VERSION = 1;

export const TERMS_OF_USE_URL = 'https://www.templewallet.com/terms';

export const PRIVACY_POLICY_URL = 'https://www.templewallet.com/privacy';

export const OPEN_EXTENSION_TAB_ACTIONS_COUNTER_STORAGE_KEY = 'OPEN_EXTENSION_TAB_ACTIONS_COUNTER';

export const MAX_OPEN_EXTENSION_TAB_ACTIONS_COUNTER = 1;

export const MAX_SHOW_AGREEMENTS_COUNTER = 1;

const isMacOS = /Mac OS/.test(navigator.userAgent);
export const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;

export const FEE_PER_GAS_UNIT = 0.1;

export const LIQUIDITY_BAKING_DEX_ADDRESS = 'KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5';

export const THEME_COLOR_SEARCH_PARAM_NAME = 'tc';
export const FONT_SIZE_SEARCH_PARAM_NAME = 'fs';
export const LINE_HEIGHT_SEARCH_PARAM_NAME = 'lh';
