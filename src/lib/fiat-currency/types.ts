export enum FiatCurrenciesEnum {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  AUD = 'AUD',
  CAD = 'CAD',
  CHF = 'CHF',
  CNY = 'CNY',
  DKK = 'DKK',
  HKD = 'HKD',
  IDR = 'IDR',
  INR = 'INR',
  KRW = 'KRW',
  MXN = 'MXN',
  NZD = 'NZD',
  PLN = 'PLN',
  SEK = 'SEK',
  SGD = 'SGD',
  THB = 'THB',
  TRY = 'TRY',
  TWD = 'TWD',
  UAH = 'UAH',
  ZAR = 'ZAR'
}

export interface FiatCurrencyOptionBase {
  name: FiatCurrenciesEnum;
  apiLabel: string;
  symbol: string;
}

export interface FiatCurrencyOption extends FiatCurrencyOptionBase {
  fullname: string;
}

export interface CoingeckoFiatInterface {
  tezos: Record<string, number>;
}
