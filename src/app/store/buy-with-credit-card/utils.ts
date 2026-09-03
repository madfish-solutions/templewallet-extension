import { Currency } from 'lib/apis/moonpay';
import { MtPelerinCurrenciesResponse } from 'lib/apis/temple';
import {
  isEligibleMtPelerinCrypto,
  isEligibleMtPelerinFiat,
  isEligibleMoonPayCrypto,
  isEligibleMoonPayFiat,
  mtPelerinCryptoToTopUpSlug,
  moonPayCryptoToTopUpSlug
} from 'lib/buy-with-credit-card/provider-currencies.utils';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

import { TopUpProviderCurrencies } from './state';

const MOONPAY_ICONS_BASE_URL = 'https://static.moonpay.com/widget/currencies/';

const irregularMoonpayTokenCodes = [
  { regex: /^usd1/, iconName: 'usd1.png' },
  { regex: /^pyusd/, iconName: 'paypal-usd-pyusd-logo.svg' },
  { regex: /^(pol_polygon|pol)$/, iconName: 'matic.svg' }
];

const getMoonpayFiatIconUrl = (currencyCode: string) => `${MOONPAY_ICONS_BASE_URL}${currencyCode.toLowerCase()}.svg`;

const getMoonpayTokenIconUrl = (tokenCode: string) => {
  const normalizedTokenCode = tokenCode.toLowerCase();

  const irregularMoonpayTokenMatch = irregularMoonpayTokenCodes.find(code => code.regex.test(normalizedTokenCode));

  if (irregularMoonpayTokenMatch) return `${MOONPAY_ICONS_BASE_URL}${irregularMoonpayTokenMatch.iconName}`;

  return `${MOONPAY_ICONS_BASE_URL}${normalizedTokenCode}.svg`;
};

export const mapMoonPayProviderCurrencies = (currencies: Currency[]): TopUpProviderCurrencies => ({
  fiat: currencies.filter(isEligibleMoonPayFiat).map(({ name, code, minBuyAmount, maxBuyAmount, precision }) => ({
    name,
    code: code.toUpperCase(),
    codeToDisplay: code.toUpperCase().split('_')[0],
    icon: getMoonpayFiatIconUrl(code),
    providers: [TopUpProviderId.MoonPay],
    minAmount: minBuyAmount,
    maxAmount: maxBuyAmount,
    precision: Math.min(precision, 2) // Currencies like JOD have 3 decimals but Moonpay fails to process input with 3 decimals
  })),
  crypto: currencies.filter(isEligibleMoonPayCrypto).map(currency => ({
    name: currency.name,
    code: currency.code.toUpperCase(),
    codeToDisplay: currency.code.toUpperCase().split('_')[0],
    icon: getMoonpayTokenIconUrl(currency.code),
    providers: [TopUpProviderId.MoonPay],
    minAmount: currency.minBuyAmount ?? undefined,
    maxAmount: currency.maxBuyAmount ?? undefined,
    precision: currency.precision,
    slug: moonPayCryptoToTopUpSlug(currency)
  }))
});

export const mapMtPelerinProviderCurrencies = ({
  cryptoTokens,
  fiatCurrencies
}: MtPelerinCurrenciesResponse): TopUpProviderCurrencies => ({
  fiat: fiatCurrencies.filter(isEligibleMtPelerinFiat).map(({ name, symbol, iconUrl }) => ({
    name,
    code: symbol.toUpperCase(),
    icon: iconUrl,
    providers: [TopUpProviderId.MtPelerin],
    precision: 2
  })),
  crypto: cryptoTokens.filter(isEligibleMtPelerinCrypto).map(currency => {
    const { symbol, name, iconUrl, decimals } = currency;

    return {
      name,
      code: symbol,
      icon: iconUrl,
      providers: [TopUpProviderId.MtPelerin],
      precision: decimals,
      slug: mtPelerinCryptoToTopUpSlug(currency)
    };
  })
});
