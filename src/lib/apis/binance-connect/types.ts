/**
 * @example
 * ```
 * {
    cryptoCurrency: 'XTZ',
    network: 'XTZ',
    memoRequired: false,
    addressRegex: '^(tz[1,2,3])[a-zA-Z0-9]{33}$',
    memoRegex: '',
    withdrawFee: 0.1,
    withdrawMax: 10000000000,
    withdrawMin: 1,
    withdrawIntegerMultiple: 0.000001,
    contractAddress: null
 * }
 * ```
 * @example
 * ```
 * {
    cryptoCurrency: 'USDT',
    network: 'XTZ',
    memoRequired: false,
    addressRegex: '^(tz[1,2,3])[a-zA-Z0-9]{33}$',
    memoRegex: '',
    withdrawFee: 1,
    withdrawMax: 10000000000,
    withdrawMin: 10,
    withdrawIntegerMultiple: 0.000001,
    contractAddress: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o'
 * }
 * ```
 */
export interface GetCryptoNetworksResponseItem {
  network: 'XTZ';
  /** `null` for 'XTZ' */
  contractAddress: string | null;
  /** E.g. 'XTZ', 'USDT' */
  cryptoCurrency: string;
  memoRequired: boolean;
  withdrawFee: number;
  /** Regarding crypto asset */
  withdrawMin: number;
  /** Regarding crypto asset */
  withdrawMax: number;
  addressRegex: string;
  /** Asset penny amount */
  withdrawIntegerMultiple: number;
}

/**
 * @example
 * ```
 * {
    fiatCurrency: 'USD',
    cryptoCurrency: 'USDT',
    paymentMethod: 'card',
    size: 2,
    quotation: 1.02520253,
    minLimit: 15,
    maxLimit: 20000
 * }
 * ```
 */
export interface GetTradePairsResponseItem {
  fiatCurrency: string;
  cryptoCurrency: string;
  paymentMethod: string;
  size: number;
  /** @deprecated
    This quotation is just an estimate value, Merchant should not use this value for calculation, ranking or competition.

    If merchant want to get a more precise quotation, please call [3.9 get-quote]
   */
  quotation: number;
  /** Regarding fiat */
  minLimit: number;
  /** Regarding fiat */
  maxLimit: number;
}

export interface GetBinanceConnectCurrenciesResponse {
  assets: GetCryptoNetworksResponseItem[];
  pairs: GetTradePairsResponseItem[];
}

/**
 * @example
 * ```
 * {
    fiatCurrency: 'USD',
    cryptoCurrency: 'USDT',
    cryptoNetwork: 'XTZ',
    paymentMethod: 'CARD',
    fiatAmount: 35
    countryCode: 'US'
 * }
 * ```
 */
export interface GetQuoteRequestPayload {
  fiatCurrency: string;
  cryptoCurrency: string;
  cryptoNetwork: 'XTZ';
  paymentMethod: 'CARD';
  fiatAmount: number;
  countryCode?: string;
}

/**
 * @example
 * ```
 * {
    quotePrice: 1.01520304,
    userFee: 0.7,
    networkFee: 1,
    cryptoAmount: 32.786344
 * }
 * ```
 */
export interface GetQuoteResponse {
  quotePrice: number;
  userFee: number;
  networkFee: number;
  cryptoAmount: number;
}

/**
 * @example
 * ```
 * {
    baseCurrency: 'EUR',
    businessType: 'BUY',
    cryptoCurrency: 'USDT',
    fiatCurrency: 'EUR',
    merchantOrderId: String(Date.now()),
    merchantUserId: String(Date.now()),
    orderAmount: 50,
    withdrawCryptoInfo: {
      cryptoAddress: 'tz1XQzfabXm4LZNKnok6W41rdp35qYbti9uE',
      cryptoNetwork: 'XTZ'
    },
 * }
 * ```
 */
export interface PostTradeOrderRequestPayload {
  /** Fiat */
  baseCurrency: string;
  businessType: 'BUY';
  cryptoCurrency: string;
  fiatCurrency: string;
  merchantOrderId: string;
  merchantUserId: string;
  orderAmount: number;
  withdrawCryptoInfo: {
    cryptoAddress: string;
    cryptoNetwork: string;
  };
  channelInfo: {
    paymentMethod: 'CARD' | 'P2P';
  };
}

/**
 * @example
 * ```
 * {
    eternalRedirectUrl: 'https://www.binancecnt.com/en/connect/buyflow?token=c1tc3561120114716375040519k20230519',
    token: 'c1tc3561120114716375040519k20230519',
    bindingStatus: false,
    orderId: 'CNT1b3561120114716375050519',
    expiredTime: 1684605068776
 * }
 * ```
 */
export interface PostTradeResponse {
  eternalRedirectUrl: string;
  token: string;
  bindingStatus: boolean;
  orderId: string;
  expiredTime: number;
}
