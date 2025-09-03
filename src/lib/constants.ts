import {
  ETHEREUM_MAINNET_CHAIN_ID,
  ETH_SEPOLIA_CHAIN_ID,
  TEZOS_MAINNET_CHAIN_ID,
  TempleTezosChainId
} from './temple/types';

export enum ContentScriptType {
  ExternalLinksActivity = 'ExternalLinksActivity',
  ExternalPageLocation = 'ExternalPageLocation',
  ExternalAdsActivity = 'ExternalAdsActivity',
  UpdateAdsRules = 'UpdateAdsRules',
  FetchReferralsRules = 'FetchReferralsRules',
  FetchReferrals = 'FetchReferrals',
  ReferralClick = 'ReferralClick'
}

export const APP_TITLE = 'Temple Wallet';

export const AD_CATEGORIES_PARAM_NAME = 'categories';

export const ORIGIN_SEARCH_PARAM_NAME = 'o';

export const ADS_META_SEARCH_PARAM_NAME = 'ads-meta';

export const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

export const REPLACE_REFERRALS_ENABLED = 'REPLACE_REFERRALS_ENABLED';

/** @deprecated */
export const ACCOUNT_PKH_STORAGE_KEY = 'account_publickeyhash';

/** @deprecated */
export const ADS_VIEWER_ADDRESS_STORAGE_KEY = 'ADS_VIEWER_ADDRESS';

export const ADS_VIEWER_DATA_STORAGE_KEY = 'ADS_VIEWER_DATA';

/** @deprecated */
export const CUSTOM_NETWORKS_SNAPSHOT_STORAGE_KEY = 'custom_networks_snapshot';

export const CUSTOM_TEZOS_NETWORKS_STORAGE_KEY = 'CUSTOM_TEZOS_NETWORKS';

export const TEZOS_CHAINS_SPECS_STORAGE_KEY = 'TEZOS_CHAINS_SPECS';
export const EVM_CHAINS_SPECS_STORAGE_KEY = 'EVM_CHAINS_SPECS';

export const BLOCKCHAIN_EXPLORERS_OVERRIDES_STORAGE_KEY = 'BLOCKCHAIN_EXPLORERS_OVERRIDES';

export const TOTAL_EQUITY_CURRENCY_STORAGE_KEY = 'TOTAL_EQUITY_CURRENCY';

export const ANALYTICS_USER_ID_STORAGE_KEY = 'analytics_user_id';

export const ALL_ADS_RULES_STORAGE_KEY = 'ALL_ADS_RULES';

export const ADS_RULES_UPDATE_INTERVAL = 5 * 60 * 1000;

export const AD_HIDING_TIMEOUT = 12 * 3600 * 1000;

export const AD_SEEN_THRESHOLD = 0.5;

export const HYPELAB_STUB_CAMPAIGN_SLUG = 'e55d2795d2';

export const TERMS_OF_USE_URL = 'https://www.templewallet.com/terms';

export const PRIVACY_POLICY_URL = 'https://www.templewallet.com/privacy';

const isMacOS = /Mac OS/.test(navigator.userAgent);
export const searchHotkey = ` (${isMacOS ? '⌘' : 'Ctrl + '}K)`;

export const ACCOUNT_ALREADY_EXISTS_ERR_MSG = 'Account already exists';

export const AT_LEAST_ONE_HD_ACCOUNT_ERR_MSG = 'At least one HD account should remain';

export const ACCOUNT_NAME_COLLISION_ERR_MSG = 'An account with the same name already exists in the group';

export const DEFAULT_TEZOS_DERIVATION_PATH = "m/44'/1729'/0'/0'";

export const DEFAULT_EVM_DERIVATION_PATH = "m/44'/60'/0'/0/0";

export const WALLETS_SPECS_STORAGE_KEY = 'WALLETS_SPECS';

export const ACCOUNT_EXISTS_SHOWN_WARNINGS_STORAGE_KEY = 'ACCOUNT_EXISTS_SHOWN_WARNINGS';

export const SHOULD_BACKUP_MNEMONIC_STORAGE_KEY = 'SHOULD_BACKUP_MNEMONIC';

export const SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY = 'SHOULD_SHOW_V2_INTRO_MODAL';

export const AUTOLOCK_TIME_STORAGE_KEY = 'AUTOLOCK_TIME';

export const SIDE_VIEW_WAS_FORCED_STORAGE_KEY = 'SIDE_VIEW_WAS_FORCED';

export const SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY = 'SHOULD_DISABLE_NOT_ACTIVE_NETWORKS';

export const ACCOUNTS_FOR_REENABLING_NETWORKS_STORAGE_KEY = 'ACCOUNTS_FOR_REENABLING_NETWORKS';

// Browser storage cannot set a value to Infinity
export const NEVER_AUTOLOCK_VALUE = Number.MAX_SAFE_INTEGER;

export const DEFAULT_SEED_PHRASE_WORDS_AMOUNT = 12;

export const DEFAULT_PASSWORD_INPUT_PLACEHOLDER = '••••••••••';

export const MAIN_CHAINS_IDS = [
  TEZOS_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  TempleTezosChainId.Ghostnet,
  ETH_SEPOLIA_CHAIN_ID
];

export const PASS_TO_BG_EVENT = 'templePassToBackground';

export const RESPONSE_FROM_BG_MSG_TYPE = 'templeResponseFromBackground';

export const DISCONNECT_DAPP_MSG_TYPE = 'templeDisconnectDApp';

export const SWITCH_CHAIN_MSG_TYPE = 'templeSwitchChain';

export const FEE_PER_GAS_UNIT = 0.1;
export const RECOMMENDED_ADD_TEZ_GAS_FEE = 0.00015;

export const THEME_COLOR_SEARCH_PARAM_NAME = 'tc';
export const FONT_SIZE_SEARCH_PARAM_NAME = 'fs';
export const LINE_HEIGHT_SEARCH_PARAM_NAME = 'lh';
export const EVM_ACCOUNT_SEARCH_PARAM_NAME = 'ea';
export const CHAIN_NAME_SEARCH_PARAM_NAME = 'cn';

export const SEND_ETH_GAS_LIMIT = BigInt(21000);

export const MAX_EVM_ALLOWANCE = BigInt(2) ** BigInt(256) - BigInt(1);

export const LEDGER_USB_VENDOR_ID = '0x2c97';

export const TEZOS_APY = 5.6;

export const TEZ_BURN_ADDRESS = 'tz1burnburnburnburnburnburnburjAYjjX';

export const EVM_ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const VITALIK_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

export const ASSET_HUGE_AMOUNT = 1e18;
