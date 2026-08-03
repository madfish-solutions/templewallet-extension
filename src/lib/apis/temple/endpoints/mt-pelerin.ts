import { templeWalletApi } from './templewallet.api';

export interface MtPelerinCurrenciesResponse {
  timestamp: number;
  cryptoTokens: MtPelerinToken[];
  fiatCurrencies: MtPelerinFiatCurrency[];
}

export interface MtPelerinToken extends MtPelerinParsedToken, MtPelerinTokenMetadata {}

export interface MtPelerinFiatCurrency {
  iconUrl: string;
  symbol: string;
  name: string;
  isBuySupported: boolean;
  isSellSupported: boolean;
}

interface MtPelerinParsedToken {
  network: MtPelerinNetwork;
  iconUrl: string;
  symbol: string;
  name: string;
  id: string;
}

type MtPelerinNetwork =
  | 'arbitrum_mainnet'
  | 'avalanche_mainnet'
  | 'base_mainnet'
  | 'bitcoin_mainnet'
  | 'bsc_mainnet'
  | 'celo_mainnet'
  | 'fantom_mainnet'
  | 'lightning_mainnet'
  | 'mainnet'
  | 'matic_mainnet'
  | 'optimism_mainnet'
  | 'rsk_mainnet'
  | 'sonic_mainnet'
  | 'tempo_mainnet'
  | 'tezos_mainnet'
  | 'xdai_mainnet'
  | 'zksync_mainnet';

interface MtPelerinTokenMetadata {
  symbol: string;
  network: MtPelerinNetwork;
  networkName: string;
  decimals: number;
  address: string;
  isStable: boolean;
  networkFee?: number;
  forceNetworkFee?: boolean;
  tokenId?: number;
}

export const getMtPelerinAssets = () =>
  templeWalletApi.get<MtPelerinCurrenciesResponse>('/mtpelerin-assets').then(({ data }) => data);
