export enum ContentScriptType {
  ExternalLinksActivity = 'ExternalLinksActivity',
  ExternalAdsActivity = 'ExternalAdsActivity',
  UpdateAdsRules = 'UpdateAdsRules'
}

export const ORIGIN_SEARCH_PARAM_NAME = 'o';

export const ADS_META_SEARCH_PARAM_NAME = 'ads-meta';

export const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

/** @deprecated */
export const ACCOUNT_PKH_STORAGE_KEY = 'account_publickeyhash';

export const ADS_VIEWER_TEZOS_ADDRESS_STORAGE_KEY = 'ADS_VIEWER_TEZOS_ADDRESS';

/** @deprecated */
export const CUSTOM_NETWORKS_SNAPSHOT_STORAGE_KEY = 'custom_networks_snapshot';

export const CUSTOM_TEZOS_NETWORKS_STORAGE_KEY = 'CUSTOM_TEZOS_NETWORKS';

/** @deprecated */
export const NETWORK_ID_STORAGE_KEY = 'network_id';

export const CURRENT_TEZOS_NETWORK_ID_STORAGE_KEY = 'CURRENT_TEZOS_NETWORK_ID';
export const CURRENT_EVM_NETWORK_ID_STORAGE_KEY = 'CURRENT_EVM_NETWORK_ID';

export const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics_user_id';

export const ALL_ADS_RULES_STORAGE_KEY = 'ALL_ADS_RULES';

export const ADS_RULES_UPDATE_INTERVAL = 5 * 60 * 1000;

export const AD_HIDING_TIMEOUT = 12 * 3600 * 1000;

export const AD_SEEN_THRESHOLD = 0.5;

export const HYPELAB_STUB_CAMPAIGN_SLUG = 'e55d2795d2';

const isMacOS = /Mac OS/.test(navigator.userAgent);
export const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;

export const ACCOUNT_ALREADY_EXISTS_ERR_MSG = 'Account already exists';
