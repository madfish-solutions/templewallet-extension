export enum ContentScriptType {
  ExternalLinksActivity = 'ExternalLinksActivity',
  ExternalAdsActivity = 'ExternalAdsActivity'
}

export enum AdType {
  EtherscanBuiltin = 'etherscan-builtin',
  Bitmedia = 'bitmedia',
  Coinzilla = 'coinzilla',
  Cointraffic = 'cointraffic'
}

export const WEBSITES_ANALYTICS_ENABLED = 'WEBSITES_ANALYTICS_ENABLED';

export const ACCOUNT_PKH_STORAGE_KEY = 'account_publickeyhash';

export const ETHERSCAN_BUILTIN_ADS_WEBSITES = [
  'https://etherscan.io',
  'https://bscscan.com',
  'https://polygonscan.com'
];
