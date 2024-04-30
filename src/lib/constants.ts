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

export const ADS_VIEWER_ADDRESS_STORAGE_KEY = 'ADS_VIEWER_ADDRESS';

/** @deprecated */
export const CUSTOM_NETWORKS_SNAPSHOT_STORAGE_KEY = 'custom_networks_snapshot';

export const CUSTOM_TEZOS_NETWORKS_STORAGE_KEY = 'CUSTOM_TEZOS_NETWORKS';

export const TEZOS_CHAINS_SPECS_STORAGE_KEY = 'TEZOS_CHAINS_SPECS';
export const EVM_CHAINS_SPECS_STORAGE_KEY = 'EVM_CHAINS_SPECS';

export const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics_user_id';

export const ALL_ADS_RULES_STORAGE_KEY = 'ALL_ADS_RULES';

export const ADS_RULES_UPDATE_INTERVAL = 5 * 60 * 1000;

export const AD_HIDING_TIMEOUT = 12 * 3600 * 1000;

export const AD_SEEN_THRESHOLD = 0.5;

export const HYPELAB_STUB_CAMPAIGN_SLUG = 'e55d2795d2';

const isMacOS = /Mac OS/.test(navigator.userAgent);
export const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;

export const ACCOUNT_ALREADY_EXISTS_ERR_MSG = 'Account already exists';

export const AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG = 'At least one HD account should remain';

export const ACCOUNT_NAME_COLLISION_ERR_MSG = 'An account with the same name already exists in the group';

export const DEFAULT_TEZOS_DERIVATION_PATH = "m/44'/1729'/0'/0'";

export const WALLETS_SPECS_STORAGE_KEY = 'WALLETS_SPECS';
