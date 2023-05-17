import { makeGetRequest, makePostRequest } from './requests';

interface GetCryptoNetworksItem {
  cryptoCurrency: string;
  network: string;
  memoRequired: boolean;
  withdrawFee: number;
  withdrawMin: number;
  withdrawMax: number;
}

/**
```
[
  {
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
  },
  {
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
  }
]
```
*/
export const fetchBinanceConnectNetworks = async () => {
  const response = await makeGetRequest<GetCryptoNetworksItem[]>('/get-crypto-network-list');

  return response.data.data.filter(item => item.network === 'XTZ');
};

interface TradePairsItem {
  fiatCurrency: string;
  cryptoCurrency: string;
  paymentMethod: string;
  size: number;
  quotation: number;
  minLimit: number;
  maxLimit: number;
}

/**
@arg coins // E.g. ['XTZ', 'USDT']
@example
```
[
{
  fiatCurrency: 'USD',
  cryptoCurrency: 'USDT',
  paymentMethod: 'card',
  size: 2,
  quotation: 1.02520253,
  minLimit: 15,
  maxLimit: 20000
},
]
```
*/
export const fetchBinanceConnectTradePairs = async (coins: string[]) => {
  const response = await makeGetRequest<TradePairsItem[]>('/get-trade-pair-list');

  return response.data.data.filter(item => coins.includes(item.cryptoCurrency));
};

/**
@example
```
{
  baseCurrency: 'EUR',
  businessType: 'BUY',
  cryptoCurrency: 'USDT',
  fiatCurrency: 'EUR',
  merchantOrderId: String(Date.now());
  merchantUserId: String(Date.now()),
  orderAmount: 50,
  // productDetailInfo: {
  // 	productName: 'Temple Wallet extension',
  // 	//
  // },
  withdrawCryptoInfo: {
    cryptoAddress: 'tz1XQzfabXm4LZNKnok6W41rdp35qYbti9uE',
    cryptoNetwork: 'XTZ'
  },
}
```
*/
interface TradePayload {
  baseCurrency: string;
  businessType: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  merchantOrderId: string;
  merchantUserId: string;
  orderAmount: number;
  // productDetailInfo: {
  // 	productName: 'Temple Wallet extension',
  // 	//
  // },
  withdrawCryptoInfo: {
    cryptoAddress: string;
    cryptoNetwork: string;
  };
}

interface TradeResponse {
  eternalRedirectUrl: string;
  token: string;
  bindingStatus: boolean;
  orderId: string;
  expiredTime: number;
}

export const postBinanceConnectTradeOrder = async (payload: TradePayload) => {
  const response = await makePostRequest<TradeResponse>('/trade', payload);

  return response.data.data;
};

interface OrderResponseItem {
  baseCurrency: string;
  businessType: string;
  chainSettlementFee: number;
  connectOrderId: string;
  createTime: string;
  cryptoAddress: string;
  cryptoAddressMemo: string;
  cryptoCurrency: string;
  cryptoNetwork: string;
  errorCode: string;
  errorReason: string;
}

export const queryBinanceConnectOrders = async (merchantOrderId: string) => {
  const payload = { merchantOrderId };

  const response = await makePostRequest<OrderResponseItem[] | null>('/query-order-list', payload);

  return response.data.data;
};
