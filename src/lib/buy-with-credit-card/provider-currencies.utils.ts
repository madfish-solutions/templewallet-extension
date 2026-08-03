import { isDefined } from '@rnw-community/shared';

import {
  CryptoCurrency as MoonPayCryptoCurrency,
  Currency as MoonPayCurrency,
  CurrencyType as MoonPayCurrencyType,
  FiatCurrency as MoonPayFiatCurrency
} from 'lib/apis/moonpay';
import { MtPelerinFiatCurrency, MtPelerinToken } from 'lib/apis/temple';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { toTopUpTokenSlug } from './top-up-token-slug.utils';

const mtPelerinNetworkChainIdMap: Record<string, string> = {
  mainnet: '1',
  optimism_mainnet: '10',
  rsk_mainnet: '30',
  bsc_mainnet: '56',
  xdai_mainnet: '100',
  matic_mainnet: '137',
  fantom_mainnet: '250',
  zksync_mainnet: '324',
  arbitrum_mainnet: '42161',
  celo_mainnet: '42220',
  avalanche_mainnet: '43114',
  base_mainnet: '8453',
  sonic_mainnet: '146'
};

const isMoonPayTezosNetwork = (metadata: MoonPayCryptoCurrency['metadata']) =>
  metadata.networkCode.toLowerCase() === 'tezos';

const isMtPelerinTezosNetwork = (network: string) => network === 'tezos_mainnet';

/** Null/empty/zero-address → native gas token; anything else is kept for slug building. */
const toContractAddressOrNative = (address: string | null | undefined): string | null => {
  if (!address?.trim()) return null;

  return address.toLowerCase() === EVM_ZERO_ADDRESS.toLowerCase() ? null : address;
};

export const isEligibleMoonPayFiat = (currency: MoonPayCurrency): currency is MoonPayFiatCurrency =>
  currency.type === MoonPayCurrencyType.Fiat && currency.isSellSupported;

export const isEligibleMoonPayCrypto = (currency: MoonPayCurrency): currency is MoonPayCryptoCurrency =>
  currency.type === MoonPayCurrencyType.Crypto &&
  currency.supportsLiveMode &&
  !currency.isSuspended &&
  (isMoonPayTezosNetwork(currency.metadata) || isDefined(currency.metadata.chainId));

export const isEligibleMtPelerinFiat = ({ isBuySupported }: MtPelerinFiatCurrency) => isBuySupported;

export const isEligibleMtPelerinCrypto = ({ network }: MtPelerinToken) =>
  isMtPelerinTezosNetwork(network) || isDefined(mtPelerinNetworkChainIdMap[network]);

export const moonPayCryptoToTopUpSlug = ({ metadata }: MoonPayCryptoCurrency) =>
  toTopUpTokenSlug(
    toContractAddressOrNative(metadata.contractAddress),
    undefined,
    isMoonPayTezosNetwork(metadata) ? TempleChainKind.Tezos : TempleChainKind.EVM,
    isDefined(metadata.chainId) ? metadata.chainId : TEZOS_MAINNET_CHAIN_ID
  );

export const mtPelerinCryptoToTopUpSlug = ({ network, tokenId, address }: MtPelerinToken) =>
  toTopUpTokenSlug(
    toContractAddressOrNative(address),
    tokenId,
    isMtPelerinTezosNetwork(network) ? TempleChainKind.Tezos : TempleChainKind.EVM,
    isMtPelerinTezosNetwork(network) ? TEZOS_MAINNET_CHAIN_ID : mtPelerinNetworkChainIdMap[network]
  );

export const getMtPelerinNetworkByChain = (chainKind: TempleChainKind, chainId: string) => {
  if (chainKind === TempleChainKind.Tezos) return 'tezos_mainnet';

  return Object.entries(mtPelerinNetworkChainIdMap).find(([, networkChainId]) => networkChainId === chainId)?.[0];
};
