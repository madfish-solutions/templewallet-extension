import axios from 'axios';

import { CurrencyToken } from 'app/templates/TopUpInput';
import { EnvVars } from 'lib/env';
import { TEZOS_METADATA } from 'lib/metadata';

import {
  ExchangeCoin,
  ExchangeDataInterface,
  ExolixCurrenciesInterface,
  GetRateRequestData,
  GetRateResponse,
  GetRateResponseWithAmountTooLow
} from './exolix.interface';

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
  api
    .get<ExolixCurrenciesInterface>('/currencies', { params: { size: currenciesLimit, page, withNetworks: true } })
    .then(r => r.data);

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
    const { rate } = await queryExchange(exchangeData);

    return rate ?? 1;
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

    const forwardExchangeData = {
      coinTo: inputAssetCode,
      coinToNetwork: inputAssetNetwork,
      coinFrom: outputAssetCode,
      coinFromNetwork: outputAssetNetwork,
      amount: (MAX_DOLLAR_VALUE + AVG_COMISSION) / outputTokenPrice
    };

    const backwardExchangeData = {
      coinTo: outputAssetCode,
      coinToNetwork: outputAssetNetwork,
      coinFrom: inputAssetCode,
      coinFromNetwork: inputAssetNetwork,
      amount: MIN_ASSET_AMOUNT
    };

    const { minAmount } = await queryExchange(backwardExchangeData);

    // setting correct exchange amount
    backwardExchangeData.amount = minAmount ?? 0;

    // correct maxAmount returns only if exchange amount is correct
    const { maxAmount } = await queryExchange(backwardExchangeData);

    // getting maxAmount for our own maximum dollar exchange amount
    const { message, toAmount } = await queryExchange(forwardExchangeData);

    // if there is a message than something went wrong with the estimation and some values may be incorrect
    return { finalMinAmount: minAmount ?? 0, finalMaxAmount: (message === null ? toAmount : maxAmount) ?? 0 };
  } catch (error) {
    console.error({ error });

    return { finalMinAmount: 0, finalMaxAmount: 0 };
  }
};

export const queryExchange = (data: GetRateRequestData) =>
  api.get<GetRateResponse>('/rate', { params: { ...data, rateType: 'fixed' } }).then(
    r => r.data,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
        const data = error.response.data;
        if (data && data.error == null) return data as GetRateResponseWithAmountTooLow;
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
