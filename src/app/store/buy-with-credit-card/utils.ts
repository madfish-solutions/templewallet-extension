import { isDefined } from '@rnw-community/shared';
import { AxiosResponse } from 'axios';
import FiatCurrencyInfo from 'currency-codes';

import {
  CryptoCurrency as MoonPayCryptoCurrency,
  Currency,
  CurrencyType as MoonPayCurrencyType,
  FiatCurrency as MoonPayFiatCurrency
} from 'lib/apis/moonpay';
import { AliceBobPairInfo } from 'lib/apis/temple';
import { CurrencyInfoType as UtorgCurrencyInfoType, UtorgCurrencyInfo } from 'lib/apis/utorg';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { FIAT_ICONS_SRC } from 'lib/icons';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { TopUpProviderCurrencies } from './state';

interface AliceBobFiatCurrency {
  name: string;
  code: string;
  icon: string;
  precision: number;
}

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';
const UTORG_CRYPTO_ICONS_BASE_URL = 'https://utorg.pro/img/cryptoIcons';

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

const knownAliceBobFiatCurrencies: Record<string, AliceBobFiatCurrency> = {
  UAH: {
    name: getCurrencyNameByCode('UAH'),
    code: 'UAH',
    icon: FIAT_ICONS_SRC.UAH,
    precision: 2
  },
  MYR: {
    name: getCurrencyNameByCode('MYR'),
    code: 'MYR',
    icon: `${UTORG_FIAT_ICONS_BASE_URL}MY.svg`,
    precision: 2
  },
  KZT: {
    name: getCurrencyNameByCode('KZT'),
    code: 'KZT',
    icon: FIAT_ICONS_SRC.KZT,
    precision: 2
  }
};

const aliceBobTezos = {
  name: 'Tezos',
  code: 'XTZ',
  icon: 'https://static.moonpay.com/widget/currencies/xtz.svg',
  precision: 6,
  chainAssetSlug: toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG)
};

const isTez = (metadata: MoonPayCryptoCurrency['metadata']) => metadata.networkCode.toLowerCase() === 'tezos';

const polygonCodes = ['pol_polygon', 'pol'];

const getMoonpayTokenIconUrl = (tokenCode: string) => {
  if (polygonCodes.includes(tokenCode)) return 'https://static.moonpay.com/widget/currencies/matic.svg';

  return `https://static.moonpay.com/widget/currencies/${tokenCode}.svg`;
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
      icon: `https://static.moonpay.com/widget/currencies/${code}.svg`,
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
        (isTez(currency.metadata) || isDefined(currency.metadata.chainId))
    )
    .map(({ name, code, precision, minBuyAmount, maxBuyAmount, metadata }) => ({
      name,
      code: code.toUpperCase(),
      codeToDisplay: code.toUpperCase().split('_')[0],
      icon: getMoonpayTokenIconUrl(code),
      minAmount: minBuyAmount ?? undefined,
      maxAmount: maxBuyAmount ?? undefined,
      precision,
      chainAssetSlug: toChainAssetSlug(
        isTez(metadata) ? TempleChainKind.Tezos : TempleChainKind.EVM,
        isDefined(metadata.chainId) ? metadata.chainId : TEZOS_MAINNET_CHAIN_ID,
        isDefined(metadata.contractAddress)
          ? metadata.contractAddress
          : isTez(metadata)
          ? TEZ_TOKEN_SLUG
          : EVM_TOKEN_SLUG
      )
    }))
});

export const mapUtorgProviderCurrencies = (currencies: UtorgCurrencyInfo[]): TopUpProviderCurrencies => ({
  fiat: currencies
    .filter(({ type, depositMax }) => type === UtorgCurrencyInfoType.FIAT && depositMax > 0)
    .map(({ display, symbol: code, depositMin, depositMax, precision }) => ({
      name: getCurrencyNameByCode(code),
      code,
      codeToDisplay: display,
      icon: `${UTORG_FIAT_ICONS_BASE_URL}${code.slice(0, -1)}.svg`,
      precision,
      minAmount: depositMin,
      maxAmount: depositMax
    })),
  crypto: currencies
    .filter(
      ({ chain, type, depositMax }) => type === UtorgCurrencyInfoType.CRYPTO && depositMax > 0 && chain === 'TEZOS'
    )
    .map(({ currency, display, precision }) => ({
      name: display,
      code: currency,
      codeToDisplay: display,
      icon: `${UTORG_CRYPTO_ICONS_BASE_URL}/${currency}.svg`,
      precision,
      chainAssetSlug: toChainAssetSlug(TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID, TEZ_TOKEN_SLUG)
    }))
});

export const mapAliceBobProviderCurrencies = (
  response: AxiosResponse<{ pairsInfo: AliceBobPairInfo[] }>
): TopUpProviderCurrencies => ({
  fiat: response.data.pairsInfo.map(pair => {
    const [minAmountString, code] = pair.minamount.split(' ');
    const minAmount = Number(minAmountString);
    const maxAmount = Number(pair.maxamount.split(' ')[0]);

    if (knownAliceBobFiatCurrencies[code]) {
      return {
        ...knownAliceBobFiatCurrencies[code],
        minAmount,
        maxAmount
      };
    }

    return {
      name: getCurrencyNameByCode(code),
      code,
      icon: `https://static.moonpay.com/widget/currencies/${code.toLowerCase()}.svg`,
      precision: 2,
      minAmount,
      maxAmount
    };
  }),
  crypto: [aliceBobTezos]
});
