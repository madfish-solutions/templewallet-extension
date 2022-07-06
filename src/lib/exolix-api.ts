import axios from 'axios';

interface ExchangeCoin {
  coinCode: string;
  coinName: string;
  icon: string;
  memoName: string;
  network: string;
  networkName: string;
  networkShortName: string;
}

interface ExchangeHash {
  hash: string | null;
  link: string | null;
}

export interface ExchangeDataInterface {
  amount: string;
  amountTo: string;
  coinFrom: ExchangeCoin;
  coinTo: ExchangeCoin;
  createdAt: string;
  depositAddress: string;
  depositExtraId: string | null;
  withdrawalAddress: string;
  withdrawalExtraId: string | null;
  hashIn: ExchangeHash;
  hashOut: ExchangeHash;
  id: string;
  comment: string | null;
  rate: string;
  status: string;
}

export enum ExchangeDataStatusEnum {
  WAIT = 'wait',
  CONFIRMATION = 'confirmation',
  EXCHANGING = 'exchanging',
  SUCCESS = 'success',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded'
}

interface CurrenciesInterface {
  data: Array<{
    icon: string;
    name: string;
    code: string;
  }>;
}

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
      totalData.concat(result.data);
    }
  }
  return totalData;
};

const getCurrency = async (page = 1) => {
  return api.get<CurrenciesInterface>('/currencies', { params: { size: currenciesLimit, page } }).then(r => r.data);
};

export interface GetRateData {
  toAmount: number;
  rate: number;
  minAmount: number;
}

export const getRate = async (data: { coinFrom: string; coinTo: string; amount: number }) => {
  return api
    .get('/rate', { params: data })
    .then(r => r.data as GetRateData)
    .catch(error => {
      if (error.response) {
        return error.response.data;
      }
    });
};

export const submitExchange = async (data: {
  coinFrom: string;
  coinTo: string;
  amount: number;
  withdrawalAddress: string;
  withdrawalExtraId: string;
}) => {
  return api.post('/transactions', data).then(r => r.data);
};

export const getExchangeData = async (exchangeId: string) => {
  return api.get<ExchangeDataInterface>(`/transactions/${exchangeId}`).then(r => r.data);
};
