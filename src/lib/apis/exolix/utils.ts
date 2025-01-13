import retry from 'async-retry';
import axios from 'axios';

import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';
import { EnvVars } from 'lib/env';

import { ExchangeData, ExolixCurrenciesResponse, GetRateRequestData, GetRateResponse } from './types';

const API_KEY = EnvVars.TEMPLE_WALLET_EXOLIX_API_KEY;

/** Due to legal restrictions */
const MAX_DOLLAR_VALUE = 10000;
const MIN_ASSET_AMOUNT = 0.00001;
const AVG_COMISSION = 300;

const COMMON_RETRY_CONFIG = { retries: 5, minTimeout: 250, maxTimeout: 1000 };

const api = axios.create({
  baseURL: 'https://exolix.com/api/v2',
  headers: {
    Authorization: API_KEY
  }
});

const currenciesLimit = 100;

export const getAllCurrencies = async (): Promise<Array<StoredExolixCurrency>> => {
  let page = 1;
  let result = await getCurrencies(page);
  let totalData = result.data;
  while (result && result.data && result.data.length === currenciesLimit) {
    page++;
    result = await getCurrencies(page);
    if (result && result.data) {
      totalData = totalData.concat(result.data);
    }
  }
  return totalData
    .map(({ code, icon, name, networks }) =>
      networks.map(network => ({
        code,
        icon,
        name,
        network: {
          code: network.network,
          fullName: network.name,
          shortName: network.shortName === '' ? null : network.shortName
        }
      }))
    )
    .flat();
};

const getCurrencies = (page: number) =>
  retry(
    () =>
      api
        .get<ExolixCurrenciesResponse>('/currencies', { params: { size: currenciesLimit, page, withNetworks: true } })
        .then(r => r.data),
    COMMON_RETRY_CONFIG
  );

const loadUSDTRate = async (coinTo: string, coinToNetwork: string) => {
  const exchangeData = {
    coinTo,
    coinToNetwork,
    coinFrom: 'USDT',
    coinFromNetwork: 'ETH',
    amount: 500
  };

  try {
    const result = await queryExchange(exchangeData);

    return 'rate' in result ? result.rate : 1;
  } catch (error) {
    console.error({ error });

    return 1;
  }
};

// executed only once per changed pair to determine min, max
export const loadMinMaxExchangeValues = async (
  inputAssetCode = 'BTC',
  inputAssetNetwork = 'BTC',
  outputAssetCode = 'XTZ',
  outputAssetNetwork = 'XTZ'
) => {
  try {
    const exchangeData = {
      coinTo: outputAssetCode,
      coinToNetwork: outputAssetNetwork,
      coinFrom: inputAssetCode,
      coinFromNetwork: inputAssetNetwork,
      amount: MIN_ASSET_AMOUNT
    };

    let minAmountExchangeResponse = await queryExchange(exchangeData);

    // This is thrown when MIN_ASSET_AMOUNT is greater than maxAmount, which is unlikely to happen
    if (!('minAmount' in minAmountExchangeResponse)) {
      throw new Error('Failed to get minimal input amount');
    }

    let finalMinAmount = minAmountExchangeResponse.minAmount;
    // setting correct exchange amount
    exchangeData.amount = minAmountExchangeResponse.minAmount;

    if (!('maxAmount' in minAmountExchangeResponse)) {
      for (let i = 0; i < 2; i++) {
        // Getting maxAmount from the response for minimal exchange
        minAmountExchangeResponse = await queryExchange(exchangeData);

        if ('maxAmount' in minAmountExchangeResponse) {
          break;
        }

        // Preparing to try again with the new minimal amount
        finalMinAmount = minAmountExchangeResponse.minAmount;
        exchangeData.amount = minAmountExchangeResponse.minAmount;
      }
    }

    if (!('maxAmount' in minAmountExchangeResponse)) {
      throw new Error('Failed to get maximal input amount');
    }

    // Trying to get an input amount for an output of 10K USD worth by getting reverse exchange
    const outputTokenPrice = await loadUSDTRate(outputAssetCode, outputAssetNetwork);
    const backwardExchange = await queryExchange({
      coinTo: inputAssetCode,
      coinToNetwork: inputAssetNetwork,
      coinFrom: outputAssetCode,
      coinFromNetwork: outputAssetNetwork,
      amount: (MAX_DOLLAR_VALUE + AVG_COMISSION) / outputTokenPrice
    });
    // Ignoring the invalid output of the backward exchange
    const maxDollarValueMaxAmount =
      backwardExchange.message == null && backwardExchange.toAmount >= finalMinAmount
        ? backwardExchange.toAmount
        : undefined;

    return {
      finalMinAmount,
      // Choosing the least of maxAmount from the first exchange and the output of backward exchange, if any
      finalMaxAmount: Math.min(minAmountExchangeResponse.maxAmount, maxDollarValueMaxAmount ?? Infinity)
    };
  } catch (error) {
    console.error({ error });

    return { finalMinAmount: 0, finalMaxAmount: 0 };
  }
};

export const queryExchange = (data: GetRateRequestData): Promise<GetRateResponse> =>
  retry(
    () =>
      api.get<GetRateResponse>('/rate', { params: { ...data, rateType: 'fixed' } }).then(
        r => r.data,
        (error: unknown) => {
          if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
            const data = error.response.data;
            if (data && data.error == null) return data;
          }
          console.error(error);
          throw error;
        }
      ),
    COMMON_RETRY_CONFIG
  );

export const submitExchange = (data: {
  coinFrom: string;
  networkFrom: string;
  coinTo: string;
  networkTo: string;
  amount: number;
  withdrawalAddress: string;
  withdrawalExtraId: string;
}) => retry(() => api.post('/transactions', { ...data, rateType: 'fixed' }).then(r => r.data), COMMON_RETRY_CONFIG);

export const getExchangeData = (exchangeId: string) =>
  retry(() => api.get<ExchangeData>(`/transactions/${exchangeId}`).then(r => r.data), COMMON_RETRY_CONFIG);
