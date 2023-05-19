import { makeGetRequest, makePostRequest } from './requests';
import {
  GetBinanceConnectCurrenciesResponse,
  GetCryptoNetworksResponseItem,
  GetQuoteRequestPayload,
  GetQuoteResponse,
  GetTradePairsResponseItem,
  PostTradeOrderRequestPayload,
  PostTradeResponse
} from './types';

const fetchTezosAssetsInfo = async () => {
  const data = await makeGetRequest<GetCryptoNetworksResponseItem[]>('/get-crypto-network-list');

  return data.filter(item => item.network === 'XTZ');
};

/**
 * @arg coins // E.g. ['XTZ', 'USDT']
 */
const fetchTezosTradePairsWithCardPaymentMethod = async (coins: string[]) => {
  const data = await makeGetRequest<GetTradePairsResponseItem[]>('/get-trade-pair-list');

  return data.filter(item => item.paymentMethod === 'card' && coins.includes(item.cryptoCurrency));
};

export const getBinanceConnectCurrencies = async (): Promise<GetBinanceConnectCurrenciesResponse> => {
  const assets = await fetchTezosAssetsInfo();

  const cryptocurrencyCodes = assets.map(item => item.cryptoCurrency);
  const pairs = await fetchTezosTradePairsWithCardPaymentMethod(cryptocurrencyCodes);

  return { assets, pairs };
};

export const estimateBinanceConnectOutput = async (
  inputFiatCode: string,
  outputCryptoCode: string,
  inputAmount: string
) => {
  const payload: GetQuoteRequestPayload = {
    fiatCurrency: inputFiatCode,
    cryptoCurrency: outputCryptoCode,
    cryptoNetwork: 'XTZ',
    paymentMethod: 'CARD',
    fiatAmount: Number(inputAmount)
    // countryCode: 'US'
  };

  const data = await makePostRequest<GetQuoteResponse>('/get-quote', payload);

  return data.cryptoAmount;
};

export const createBinanceConnectTradeOrder = async (
  fiatCurrency: string,
  cryptoCurrency: string,
  amount: number,
  accountPkh: string
) => {
  const merchantOrderId = String(Date.now());
  const merchantUserId = accountPkh;

  const payload: PostTradeOrderRequestPayload = {
    baseCurrency: fiatCurrency,
    businessType: 'BUY',
    cryptoCurrency: cryptoCurrency,
    fiatCurrency: fiatCurrency,
    merchantOrderId,
    merchantUserId,
    orderAmount: amount,
    withdrawCryptoInfo: {
      cryptoAddress: accountPkh,
      cryptoNetwork: 'XTZ'
    },
    channelInfo: {
      paymentMethod: 'CARD'
    }
  };

  const data = await makePostRequest<PostTradeResponse>('/trade', payload);

  return data.eternalRedirectUrl;
};
