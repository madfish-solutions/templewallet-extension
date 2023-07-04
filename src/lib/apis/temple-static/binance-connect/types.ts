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
interface GetCryptoNetworksResponseItem {
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
  size: number;
  /** Regarding fiat */
  minLimit: number;
  /** Regarding fiat */
  maxLimit: number;
}

export interface GetBinanceConnectCurrenciesResponse {
  assets: GetCryptoNetworksResponseItem[];
  pairs: GetTradePairsResponseItem[];
}
