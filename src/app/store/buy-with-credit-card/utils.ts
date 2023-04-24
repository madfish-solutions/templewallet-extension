import { AxiosResponse } from 'axios';

import { CryptoCurrency, FiatCurrency } from 'lib/apis/moonpay';
import { AliceBobPairInfo } from 'lib/apis/temple/endpoints/alice-bob';
import { CurrencyInfoType, UtorgCurrencyInfo } from 'lib/apis/utorg';
import { TopUpInputType } from 'lib/buy-with-credit-card/top-up-input-type.enum';

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';
const UTORG_CRYPTO_ICONS_BASE_URL = 'https://utorg.pro/img/cryptoIcons';

const knownUtorgFiatCurrenciesNames: Record<string, string> = {
  PHP: 'Philippine Peso',
  INR: 'Indian Rupee'
};

const aliceBobHryvnia = {
  name: 'Ukrainian Hryvnia',
  code: 'UAH',
  network: {
    code: '',
    fullName: '',
    shortName: ''
  },
  icon: '',
  precision: 2,
  type: TopUpInputType.Fiat
};

const aliceBobTezos = {
  name: 'Tezos',
  code: 'XTZ',
  network: {
    code: 'XTZ',
    fullName: 'Tezos Mainnet',
    shortName: 'Tezos'
  },
  icon: 'https://static.moonpay.com/widget/currencies/xtz.svg',
  precision: 6,
  slug: 'tez',
  type: TopUpInputType.Crypto
};

export const mapMoonPayProviderCurrencies = ([fiatCurrencies, cryptoCurrencies]: [
  FiatCurrency[],
  CryptoCurrency[]
]) => ({
  fiat: fiatCurrencies.map(({ name, code, icon, minBuyAmount, maxBuyAmount, precision }) => ({
    name,
    code: code.toUpperCase(),
    network: {
      code: '',
      fullName: '',
      shortName: ''
    },
    icon,
    minAmount: minBuyAmount,
    maxAmount: maxBuyAmount,
    precision: Math.min(precision, 2), // Currencies like JOD have 3 decimals but Moonpay fails to process input with 3 decimals
    type: TopUpInputType.Fiat
  })),
  crypto: cryptoCurrencies
    .filter(({ networkCode }) => networkCode.toLowerCase() === 'tezos')
    .map(({ name, code, icon, precision }) => ({
      name,
      code: code.toUpperCase(),
      network: {
        code: 'XTZ',
        fullName: 'Tezos Mainnet',
        shortName: 'Tezos'
      },
      icon,
      precision,
      type: TopUpInputType.Crypto,
      slug: '' // TODO: implement making correct slug as soon as any Tezos token is supported by Moonpay
    }))
});

export const mapUtorgProviderCurrencies = (currencies: UtorgCurrencyInfo[]) => ({
  fiat: currencies
    .filter(({ type, depositMax }) => type === CurrencyInfoType.FIAT && depositMax > 0)
    .map(({ symbol, depositMin, depositMax, precision }) => ({
      name: knownUtorgFiatCurrenciesNames[symbol] ?? '',
      code: symbol,
      network: {
        code: '',
        fullName: '',
        shortName: ''
      },
      icon: `${UTORG_FIAT_ICONS_BASE_URL}${symbol.slice(0, -1)}.svg`,
      precision,
      type: TopUpInputType.Fiat,
      minAmount: depositMin,
      maxAmount: depositMax
    })),
  crypto: currencies
    .filter(({ chain, type, depositMax }) => type === CurrencyInfoType.CRYPTO && depositMax > 0 && chain === 'TEZOS')
    .map(({ currency, symbol, precision }) => ({
      name: symbol,
      code: symbol,
      network: {
        code: 'XTZ',
        fullName: 'Tezos Mainnet',
        shortName: 'Tezos'
      },
      icon: `${UTORG_CRYPTO_ICONS_BASE_URL}/${currency}.svg`,
      precision,
      type: TopUpInputType.Crypto,
      slug: '' // TODO: implement making correct slug as soon as any Tezos token is supported by Utorg
    }))
});

export const mapAliceBobProviderCurrencies = (response: AxiosResponse<{ pairInfo: AliceBobPairInfo }>) => ({
  fiat: [
    {
      ...aliceBobHryvnia,
      minAmount: response.data.pairInfo.minAmount,
      maxAmount: response.data.pairInfo.maxAmount
    }
  ],
  crypto: [aliceBobTezos]
});
