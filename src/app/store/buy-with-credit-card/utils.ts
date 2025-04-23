import { isDefined } from '@rnw-community/shared';
import FiatCurrencyInfo from 'currency-codes';

import {
  CryptoCurrency as MoonPayCryptoCurrency,
  Currency,
  CurrencyType as MoonPayCurrencyType,
  FiatCurrency as MoonPayFiatCurrency
} from 'lib/apis/moonpay';
import { CurrencyInfoType as UtorgCurrencyInfoType, UtorgCurrencyInfo } from 'lib/apis/utorg';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { toTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { TopUpProviderCurrencies } from './state';

const MOONPAY_ICONS_BASE_URL = 'https://static.moonpay.com/widget/currencies/';

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';
const UTORG_CRYPTO_ICONS_BASE_URL = 'https://utorg.pro/img/cryptoIcons/';

const getCurrencyNameByCode = (code: string) => {
  const customCurrencyNames: StringRecord = {
    UAH: 'Ukrainian Hryvnia',
    KZT: 'Kazakhstani Tenge'
  };

  if (isDefined(customCurrencyNames[code])) {
    return customCurrencyNames[code];
  }

  const currencyInfo = FiatCurrencyInfo.code(code);

  return isDefined(currencyInfo) ? currencyInfo.currency : '???';
};

const isMoonpayTez = (metadata: MoonPayCryptoCurrency['metadata']) => metadata.networkCode.toLowerCase() === 'tezos';

const polygonCodes = ['pol_polygon', 'pol'];

const getMoonpayTokenIconUrl = (tokenCode: string) => {
  if (polygonCodes.includes(tokenCode)) return `${MOONPAY_ICONS_BASE_URL}matic.svg`;

  return `${MOONPAY_ICONS_BASE_URL + tokenCode}.svg`;
};

export const mapMoonPayProviderCurrencies = (currencies: Currency[]): TopUpProviderCurrencies => ({
  fiat: currencies
    .filter(
      (currency): currency is MoonPayFiatCurrency =>
        currency.type === MoonPayCurrencyType.Fiat && currency.isSellSupported
    )
    .map(({ name, code, minBuyAmount, maxBuyAmount, precision }) => ({
      name,
      code: code.toUpperCase(),
      codeToDisplay: code.toUpperCase().split('_')[0],
      icon: `${MOONPAY_ICONS_BASE_URL + code}.svg`,
      providers: [TopUpProviderId.MoonPay],
      minAmount: minBuyAmount,
      maxAmount: maxBuyAmount,
      precision: Math.min(precision, 2) // Currencies like JOD have 3 decimals but Moonpay fails to process input with 3 decimals
    })),
  crypto: currencies
    .filter(
      (currency): currency is MoonPayCryptoCurrency =>
        currency.type === MoonPayCurrencyType.Crypto &&
        currency.supportsLiveMode &&
        !currency.isSuspended &&
        (isMoonpayTez(currency.metadata) || isDefined(currency.metadata.chainId))
    )
    .map(({ name, code, precision, minBuyAmount, maxBuyAmount, metadata }) => ({
      name,
      code: code.toUpperCase(),
      icon: getMoonpayTokenIconUrl(code),
      providers: [TopUpProviderId.MoonPay],
      minAmount: minBuyAmount ?? undefined,
      maxAmount: maxBuyAmount ?? undefined,
      precision,
      slug: toTopUpTokenSlug(
        code.toUpperCase().split('_')[0],
        isMoonpayTez(metadata) ? TempleChainKind.Tezos : TempleChainKind.EVM,
        isDefined(metadata.chainId) ? metadata.chainId : TEZOS_MAINNET_CHAIN_ID
      )
    }))
});

const utorgChainChainIdMap: Record<string, string> = {
  ARBITRUM: '42161',
  AVALANCHE: '43114',
  POLYGON: '137',
  ETHEREUM: '1',
  BINANCE_SMART_CHAIN: '56',
  VECHAIN: '100009'
};

const isUtorgTez = (chain?: string) => chain === 'TEZOS';

const getUtorgTokenIconUrl = (code: string, symbol: string) => {
  if (symbol.startsWith('USDT')) return `${MOONPAY_ICONS_BASE_URL}usdt.svg`;
  if (symbol.startsWith('USDC')) return `${MOONPAY_ICONS_BASE_URL}usdc.svg`;

  return `${UTORG_CRYPTO_ICONS_BASE_URL + code}.svg`;
};

export const mapUtorgProviderCurrencies = (currencies: UtorgCurrencyInfo[]): TopUpProviderCurrencies => ({
  fiat: currencies
    .filter(({ type, depositMax }) => type === UtorgCurrencyInfoType.FIAT && depositMax > 0)
    .map(({ display, symbol: code, depositMin, depositMax, precision }) => ({
      name: getCurrencyNameByCode(code),
      code,
      codeToDisplay: display,
      icon: `${UTORG_FIAT_ICONS_BASE_URL}${code.slice(0, -1)}.svg`,
      providers: [TopUpProviderId.Utorg],
      precision,
      minAmount: depositMin,
      maxAmount: depositMax
    })),
  crypto: currencies
    .filter(
      ({ chain, type, depositMax, enabled }) =>
        type === UtorgCurrencyInfoType.CRYPTO &&
        depositMax > 0 &&
        enabled &&
        isDefined(chain) &&
        (isDefined(utorgChainChainIdMap[chain]) || isUtorgTez(chain))
    )
    .map(({ currency, display, caption, precision, chain }) => ({
      name: caption,
      code: currency,
      icon: getUtorgTokenIconUrl(currency, display),
      providers: [TopUpProviderId.Utorg],
      precision,
      slug: toTopUpTokenSlug(
        display,
        isUtorgTez(chain) ? TempleChainKind.Tezos : TempleChainKind.EVM,
        isUtorgTez(chain) ? TEZOS_MAINNET_CHAIN_ID : utorgChainChainIdMap[chain!]
      )
    }))
});
