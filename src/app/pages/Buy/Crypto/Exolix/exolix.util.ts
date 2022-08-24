import axios from 'axios';

import { outputTokensList } from 'app/pages/Buy/Crypto/Exolix/config';

import { CurrencyInterface, ExchangeDataInterface, ExolixCurrenciesInterface, GetRateData } from './exolix.interface';

const API_KEY = process.env.TEMPLE_WALLET_EXOLIX_API_KEY;

const api = axios.create({
  baseURL: 'https://exolix.com/api/v2',
  ...(API_KEY && {
    headers: {
      Authorization: API_KEY
    }
  })
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
        network: network.network,
        networkFullName: network.name,
        networkShortName: network.shortName === '' ? null : network.shortName
      }))
    )
    .flat()
    .filter(
      ({ name, network }) =>
        outputTokensList.find(outputToken => outputToken.name === name && outputToken.network === network) === undefined
    );
};

const getCurrency = async (page = 1) => {
  return api
    .get<ExolixCurrenciesInterface>('/currencies', { params: { size: currenciesLimit, page, withNetworks: true } })
    .then(r => r.data);
};

export const getCurrenciesCount = async () => {
  return api.get<ExolixCurrenciesInterface>('/currencies').then(r => r.data.count);
};

export const getRate = async (data: {
  coinFrom: string;
  coinFromNetwork: string;
  coinTo: string;
  coinToNetwork: string;
  amount: number;
}) => {
  return api
    .get('/rate', { params: { ...data, rateType: 'fixed' } })
    .then(r => r.data as GetRateData)
    .catch(error => {
      if (error.response) {
        return error.response.data;
      }
    });
};

export const submitExchange = async (data: {
  coinFrom: string;
  networkFrom: string;
  coinTo: string;
  networkTo: string;
  amount: number;
  withdrawalAddress: string;
  withdrawalExtraId: string;
}) => {
  return api.post('/transactions', { ...data, rateType: 'fixed' }).then(r => r.data);
};

export const getExchangeData = async (exchangeId: string) => {
  return api.get<ExchangeDataInterface>(`/transactions/${exchangeId}`).then(r => r.data);
};

export const getProperNetworkFullName = (currency?: CurrencyInterface) =>
  currency
    ? currency.name === currency.networkFullName
      ? currency.networkFullName + ' Mainnet'
      : currency.networkFullName
    : '';
