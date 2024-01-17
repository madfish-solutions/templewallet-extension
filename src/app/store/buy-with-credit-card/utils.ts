import { isDefined } from '@rnw-community/shared';
import { AxiosResponse } from 'axios';
import FiatCurrencyInfo from 'currency-codes';

import {
  Currency,
  CurrencyType as MoonPayCurrencyType,
  CryptoCurrency as MoonPayCryptoCurrency,
  FiatCurrency as MoonPayFiatCurrency
} from 'lib/apis/moonpay';
import { AliceBobPairInfo } from 'lib/apis/temple';
import { CurrencyInfoType as UtorgCurrencyInfoType, UtorgCurrencyInfo } from 'lib/apis/utorg';
import { toTokenSlug } from 'lib/assets';
import { FIAT_ICONS_SRC } from 'lib/icons';

interface AliceBobFiatCurrency {
  name: string;
  code: string;
  icon: string;
  precision: number;
}

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';
const UTORG_CRYPTO_ICONS_BASE_URL = 'https://utorg.pro/img/cryptoIcons';

export const getCurrencyNameByCode = (code: string) => {
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

export const knownAliceBobFiatCurrencies: Record<string, AliceBobFiatCurrency> = {
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
  slug: 'tez'
};

export const mapMoonPayProviderCurrencies = (currencies: Currency[]) => ({
  fiat: currencies
    .filter((currency): currency is MoonPayFiatCurrency => currency.type === MoonPayCurrencyType.Fiat)
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
        currency.type === MoonPayCurrencyType.Crypto && currency.metadata.networkCode.toLowerCase() === 'tezos'
    )
    .map(({ name, code, precision, minBuyAmount, maxBuyAmount, metadata }) => ({
      name,
      code: code.toUpperCase(),
      codeToDisplay: code.toUpperCase().split('_')[0],
      icon: `https://static.moonpay.com/widget/currencies/${code}.svg`,
      minAmount: minBuyAmount ?? undefined,
      maxAmount: maxBuyAmount ?? undefined,
      precision,
      slug: isDefined(metadata.contractAddress)
        ? toTokenSlug(metadata.contractAddress, metadata.coinType ?? undefined)
        : ''
    }))
});

export const mapUtorgProviderCurrencies = (currencies: UtorgCurrencyInfo[]) => ({
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
      slug: '' // TODO: implement making correct slug as soon as any Tezos token is supported by Utorg
    }))
});

export const mapAliceBobProviderCurrencies = (response: AxiosResponse<{ pairsInfo: AliceBobPairInfo[] }>) => ({
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
