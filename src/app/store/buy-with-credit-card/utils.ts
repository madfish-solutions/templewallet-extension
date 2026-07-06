import { isDefined } from '@rnw-community/shared';
import FiatCurrencyInfo from 'currency-codes';

import { Currency } from 'lib/apis/moonpay';
import { UtorgCurrencyInfo } from 'lib/apis/utorg';
import {
  isEligibleMoonPayCrypto,
  isEligibleMoonPayFiat,
  isEligibleUtorgCrypto,
  isEligibleUtorgFiat,
  moonPayCryptoToTopUpSlug,
  utorgCryptoToTopUpSlug
} from 'lib/buy-with-credit-card/provider-currencies.utils';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

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

const polygonCodes = ['pol_polygon', 'pol'];

const getMoonpayTokenIconUrl = (tokenCode: string) => {
  if (tokenCode.includes('usdt')) return `${MOONPAY_ICONS_BASE_URL}usdt.svg`;
  if (polygonCodes.includes(tokenCode)) return `${MOONPAY_ICONS_BASE_URL}matic.svg`;

  return `${MOONPAY_ICONS_BASE_URL}${tokenCode}.svg`;
};

export const mapMoonPayProviderCurrencies = (currencies: Currency[]): TopUpProviderCurrencies => ({
  fiat: currencies.filter(isEligibleMoonPayFiat).map(({ name, code, minBuyAmount, maxBuyAmount, precision }) => ({
    name,
    code: code.toUpperCase(),
    codeToDisplay: code.toUpperCase().split('_')[0],
    icon: `${MOONPAY_ICONS_BASE_URL}${code}.svg`,
    providers: [TopUpProviderId.MoonPay],
    minAmount: minBuyAmount,
    maxAmount: maxBuyAmount,
    precision: Math.min(precision, 2) // Currencies like JOD have 3 decimals but Moonpay fails to process input with 3 decimals
  })),
  crypto: currencies.filter(isEligibleMoonPayCrypto).map(currency => ({
    name: currency.name,
    code: currency.code.toUpperCase(),
    icon: getMoonpayTokenIconUrl(currency.code),
    providers: [TopUpProviderId.MoonPay],
    minAmount: currency.minBuyAmount ?? undefined,
    maxAmount: currency.maxBuyAmount ?? undefined,
    precision: currency.precision,
    slug: moonPayCryptoToTopUpSlug(currency)
  }))
});

const getUtorgTokenIconUrl = (code: string, symbol: string) => {
  if (symbol.startsWith('USDT')) return `${MOONPAY_ICONS_BASE_URL}usdt.svg`;
  if (symbol.startsWith('USDC')) return `${MOONPAY_ICONS_BASE_URL}usdc.svg`;

  return `${UTORG_CRYPTO_ICONS_BASE_URL}${code}.svg`;
};

export const mapUtorgProviderCurrencies = (currencies: UtorgCurrencyInfo[]): TopUpProviderCurrencies => ({
  fiat: currencies.filter(isEligibleUtorgFiat).map(({ display, symbol: code, depositMin, depositMax, precision }) => ({
    name: getCurrencyNameByCode(code),
    code,
    codeToDisplay: display,
    icon: `${UTORG_FIAT_ICONS_BASE_URL}${code.slice(0, -1)}.svg`,
    providers: [TopUpProviderId.Utorg],
    precision,
    minAmount: depositMin,
    maxAmount: depositMax
  })),
  crypto: currencies.filter(isEligibleUtorgCrypto).map(currency => ({
    name: currency.caption,
    code: currency.currency,
    icon: getUtorgTokenIconUrl(currency.currency, currency.display),
    providers: [TopUpProviderId.Utorg],
    precision: currency.precision,
    slug: utorgCryptoToTopUpSlug(currency)
  }))
});
