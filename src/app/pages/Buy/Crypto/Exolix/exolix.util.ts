import retry from 'async-retry';
import axios from 'axios';

import { CurrencyToken } from 'app/templates/TopUpInput';
import { EnvVars } from 'lib/env';
import { TEZOS_METADATA } from 'lib/metadata';

import {
  ExchangeCoin,
  ExchangeDataInterface,
  ExolixCurrenciesInterface,
  GetRateRequestData,
  GetRateResponse
} from './exolix.types';

const API_KEY = EnvVars.TEMPLE_WALLET_EXOLIX_API_KEY;

/** Due to legal restrictions */
const MAX_DOLLAR_VALUE = 10000;
const MIN_ASSET_AMOUNT = 0.00001;
const AVG_COMISSION = 300;

const api = axios.create({
  baseURL: 'https://exolix.com/api/v2',
  headers: {
    Authorization: API_KEY
  }
});

const currenciesLimit = 100;

export const getCurrencies = async () => {
  let page = 1;
  let result = await getCurrency(page);
  let totalData = result.data;
  while (result && result.data && result.data.length === currenciesLimit) {
    page++;
    result = await getCurrency(page);
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

const getCurrency = (page = 1) =>
  retry(
    () =>
      api
        .get<ExolixCurrenciesInterface>('/currencies', { params: { size: currenciesLimit, page, withNetworks: true } })
        .then(r => r.data),
    { retries: 3, minTimeout: 250, maxTimeout: 1000 }
  );

export const getCurrenciesCount = () => api.get<ExolixCurrenciesInterface>('/currencies').then(r => r.data.count);

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
export const loadMinMaxFields = async (
  inputAssetCode = 'BTC',
  inputAssetNetwork = 'BTC',
  outputAssetCode = 'XTZ',
  outputAssetNetwork = 'XTZ'
) => {
  try {
    const outputTokenPrice = await loadUSDTRate(outputAssetCode, outputAssetNetwork);

    const backwardExchangeData = {
      coinTo: inputAssetCode,
      coinToNetwork: inputAssetNetwork,
      coinFrom: outputAssetCode,
      coinFromNetwork: outputAssetNetwork,
      amount: (MAX_DOLLAR_VALUE + AVG_COMISSION) / outputTokenPrice
    };

    const forwardExchangeData = {
      coinTo: outputAssetCode,
      coinToNetwork: outputAssetNetwork,
      coinFrom: inputAssetCode,
      coinFromNetwork: inputAssetNetwork,
      amount: MIN_ASSET_AMOUNT
    };

    const minAmountExchangeResponse = await queryExchange(forwardExchangeData);

    if (!('minAmount' in minAmountExchangeResponse)) {
      throw new Error('Failed to get minimal input amount');
    }

    let finalMinAmount = minAmountExchangeResponse.minAmount;
    // setting correct exchange amount
    forwardExchangeData.amount = finalMinAmount;

    let maxAmount = 0;

    for (let i = 0; i < 10; i++) {
      const maxAmountExchangeResponse = await queryExchange(forwardExchangeData);

      if ('maxAmount' in maxAmountExchangeResponse) {
        maxAmount = maxAmountExchangeResponse.maxAmount;
        break;
      }

      finalMinAmount = maxAmountExchangeResponse.minAmount;
      forwardExchangeData.amount = finalMinAmount;
    }

    if (maxAmount === 0) {
      throw new Error('Failed to get maximal input amount');
    }

    const backwardExchange = await queryExchange(backwardExchangeData);

    // if there is a message than something went wrong with the estimation and some values may be incorrect
    return {
      finalMinAmount,
      finalMaxAmount: Math.min(maxAmount, backwardExchange.message == null ? backwardExchange.toAmount : Infinity)
    };
  } catch (error) {
    console.error({ error });

    return { finalMinAmount: 0, finalMaxAmount: 0 };
  }
};

export const queryExchange = (data: GetRateRequestData): Promise<GetRateResponse> =>
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
  );

export const submitExchange = (data: {
  coinFrom: string;
  networkFrom: string;
  coinTo: string;
  networkTo: string;
  amount: number;
  withdrawalAddress: string;
  withdrawalExtraId: string;
}) => api.post('/transactions', { ...data, rateType: 'fixed' }).then(r => r.data);

export const getExchangeData = (exchangeId: string) =>
  api.get<ExchangeDataInterface>(`/transactions/${exchangeId}`).then(r => r.data);

export const getProperNetworkFullName = (currency?: CurrencyToken) => {
  if (currency == null) return '';

  const { fullName: networkFullName } = currency.network!;

  return currency.name === networkFullName ? networkFullName + ' Mainnet' : networkFullName;
};

export const getCoinCodeToDisplay = (coin: ExchangeCoin) =>
  coin.coinCode === 'XTZ' ? TEZOS_METADATA.symbol : coin.coinCode;
