import { isDefined } from '@rnw-community/shared';

import {
  CryptoCurrency as MoonPayCryptoCurrency,
  Currency as MoonPayCurrency,
  CurrencyType as MoonPayCurrencyType,
  FiatCurrency as MoonPayFiatCurrency
} from 'lib/apis/moonpay';
import { CurrencyInfoType as UtorgCurrencyInfoType, UtorgCurrencyInfo } from 'lib/apis/utorg';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { toTopUpTokenSlug } from './top-up-token-slug.utils';

const utorgChainChainIdMap: Record<string, string> = {
  ARBITRUM: '42161',
  AVALANCHE: '43114',
  POLYGON: '137',
  ETHEREUM: '1',
  BINANCE_SMART_CHAIN: '56',
  VECHAIN: '100009'
};

const isMoonPayTezosNetwork = (metadata: MoonPayCryptoCurrency['metadata']) =>
  metadata.networkCode.toLowerCase() === 'tezos';

const isUtorgTezosChain = (chain?: string) => chain === 'TEZOS';

export const isEligibleMoonPayFiat = (currency: MoonPayCurrency): currency is MoonPayFiatCurrency =>
  currency.type === MoonPayCurrencyType.Fiat && currency.isSellSupported;

export const isEligibleMoonPayCrypto = (currency: MoonPayCurrency): currency is MoonPayCryptoCurrency =>
  currency.type === MoonPayCurrencyType.Crypto &&
  currency.supportsLiveMode &&
  !currency.isSuspended &&
  (isMoonPayTezosNetwork(currency.metadata) || isDefined(currency.metadata.chainId));

export const isEligibleUtorgFiat = ({ type, depositMax }: UtorgCurrencyInfo) =>
  type === UtorgCurrencyInfoType.FIAT && depositMax > 0;

type UtorgCryptoWithChain = UtorgCurrencyInfo & { chain: string };

export const isEligibleUtorgCrypto = (currency: UtorgCurrencyInfo): currency is UtorgCryptoWithChain =>
  currency.type === UtorgCurrencyInfoType.CRYPTO &&
  currency.depositMax > 0 &&
  currency.enabled &&
  isDefined(currency.chain) &&
  (isDefined(utorgChainChainIdMap[currency.chain]) || isUtorgTezosChain(currency.chain));

export const moonPayCryptoToTopUpSlug = ({ code, metadata }: MoonPayCryptoCurrency) =>
  toTopUpTokenSlug(
    code.toUpperCase().split('_')[0],
    isMoonPayTezosNetwork(metadata) ? TempleChainKind.Tezos : TempleChainKind.EVM,
    isDefined(metadata.chainId) ? metadata.chainId : TEZOS_MAINNET_CHAIN_ID
  );

export const utorgCryptoToTopUpSlug = ({ display, chain }: UtorgCryptoWithChain) =>
  toTopUpTokenSlug(
    display,
    isUtorgTezosChain(chain) ? TempleChainKind.Tezos : TempleChainKind.EVM,
    isUtorgTezosChain(chain) ? TEZOS_MAINNET_CHAIN_ID : utorgChainChainIdMap[chain]
  );
