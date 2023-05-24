import axios from 'axios';

import { BinanceConnectError, makeGetRequest, makePostRequest } from './requests';
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
  const countryCode = await getCountryCodeByIP('91.222.113.102').catch(error => {
    console.error(error);

    return undefined;
  });

  const payload: GetQuoteRequestPayload = {
    fiatCurrency: inputFiatCode,
    cryptoCurrency: outputCryptoCode,
    cryptoNetwork: 'XTZ',
    paymentMethod: 'CARD',
    fiatAmount: Number(inputAmount),
    countryCode
  };

  try {
    const data = await makePostRequest<GetQuoteResponse>('/get-quote', payload);

    return data.cryptoAmount;
  } catch (error) {
    if (error instanceof BinanceConnectError && error.code === 'OPE100000031') return 0;

    throw error;
  }
};

export const createBinanceConnectTradeOrder = async (
  inputFiatCode: string,
  outputCryptoCode: string,
  inputAmount: number,
  accountPkh: string
) => {
  const merchantOrderId = String(Date.now());
  const merchantUserId = accountPkh;

  const payload: PostTradeOrderRequestPayload = {
    baseCurrency: inputFiatCode,
    businessType: 'BUY',
    cryptoCurrency: outputCryptoCode,
    fiatCurrency: inputFiatCode,
    merchantOrderId,
    merchantUserId,
    orderAmount: inputAmount,
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

const getCountryCodeByIP = async (ip: string) => {
  const { data } = await axios.get<{ country_code: string }>(`https://ipapi.co/${ip}/json`);

  return data.country_code;
};
