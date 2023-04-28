import { AxiosResponse } from 'axios';

import {
  Currency,
  CurrencyType as MoonPayCurrencyType,
  CryptoCurrency as MoonPayCryptoCurrency,
  FiatCurrency as MoonPayFiatCurrency
} from 'lib/apis/moonpay';
import { AliceBobPairInfo } from 'lib/apis/temple/endpoints/alice-bob';
import { CurrencyInfoType as UtorgCurrencyInfoType, UtorgCurrencyInfo } from 'lib/apis/utorg';
import { TopUpInputType } from 'lib/buy-with-credit-card/top-up-input-type.enum';
import { toTokenSlug } from 'lib/temple/assets';
import { isDefined } from 'lib/utils/is-defined';

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
    code: '',
    fullName: '',
    shortName: ''
  },
  icon: 'https://static.moonpay.com/widget/currencies/xtz.svg',
  precision: 6,
  slug: 'tez',
  type: TopUpInputType.Crypto
};

export const mapMoonPayProviderCurrencies = (currencies: Currency[]) => ({
  fiat: currencies
    .filter((currency): currency is MoonPayFiatCurrency => currency.type === MoonPayCurrencyType.Fiat)
    .map(({ name, code, minBuyAmount, maxBuyAmount, precision }) => ({
      name,
      code: code.toUpperCase(),
      displaySymbol: code.toUpperCase().split('_')[0],
      network: {
        code: '',
        fullName: '',
        shortName: ''
      },
      icon: `https://static.moonpay.com/widget/currencies/${code}.svg`,
      minAmount: minBuyAmount,
      maxAmount: maxBuyAmount,
      precision: Math.min(precision, 2), // Currencies like JOD have 3 decimals but Moonpay fails to process input with 3 decimals
      type: TopUpInputType.Fiat
    })),
  crypto: currencies
    .filter(
      (currency): currency is MoonPayCryptoCurrency =>
        currency.type === MoonPayCurrencyType.Crypto && currency.metadata.networkCode.toLowerCase() === 'tezos'
    )
    .map(({ name, code, precision, minBuyAmount, maxBuyAmount, metadata }) => ({
      name,
      code: code.toUpperCase(),
      displaySymbol: code.toUpperCase().split('_')[0],
      network: {
        code: '',
        fullName: '',
        shortName: ''
      },
      icon: `https://static.moonpay.com/widget/currencies/${code}.svg`,
      minAmount: minBuyAmount ?? undefined,
      maxAmount: maxBuyAmount ?? undefined,
      precision,
      type: TopUpInputType.Crypto,
      slug: isDefined(metadata.contractAddress)
        ? toTokenSlug(metadata.contractAddress, metadata.coinType ?? undefined)
        : ''
    }))
});

export const mapUtorgProviderCurrencies = (currencies: UtorgCurrencyInfo[]) => ({
  fiat: currencies
    .filter(({ type, depositMax }) => type === UtorgCurrencyInfoType.FIAT && depositMax > 0)
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
    .filter(
      ({ chain, type, depositMax }) => type === UtorgCurrencyInfoType.CRYPTO && depositMax > 0 && chain === 'TEZOS'
    )
    .map(({ currency, display, precision }) => ({
      name: display,
      code: currency,
      network: {
        code: '',
        fullName: '',
        shortName: ''
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
