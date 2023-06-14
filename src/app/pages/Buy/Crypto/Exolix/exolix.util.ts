import axios from 'axios';

import { outputTokensList } from 'app/pages/Buy/Crypto/Exolix/config';
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
    .flat()
    .filter(
      ({ name, network }) =>
        outputTokensList.find(outputToken => outputToken.name === name && outputToken.network.code === network.code) ===
        undefined
    );
};

const getCurrency = (page = 1) =>
  api
    .get<ExolixCurrenciesInterface>('/currencies', { params: { size: currenciesLimit, page, withNetworks: true } })
    .then(r => r.data);

export const getCurrenciesCount = () => api.get<ExolixCurrenciesInterface>('/currencies').then(r => r.data.count);

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
