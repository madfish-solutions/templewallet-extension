import retry from 'async-retry';
import axios from 'axios';

import { EnvVars } from 'lib/env';

import { ExchangeData, GetRateRequestData, GetRateResponse } from './types';

const API_KEY = EnvVars.TEMPLE_WALLET_EXOLIX_API_KEY;

const COMMON_RETRY_CONFIG = { retries: 5, minTimeout: 250, maxTimeout: 1000 };

const api = axios.create({
  baseURL: 'https://exolix.com/api/v2',
  headers: {
    Authorization: API_KEY
  }
});

export const queryCrossChainRate = (data: GetRateRequestData): Promise<GetRateResponse> =>
  retry(
    () =>
      api
        .get<GetRateResponse>('/rate', {
          params: { ...data, rateType: 'float' },
          validateStatus: status => status === 200 || status === 422
        })
        .then(r => r.data),
    COMMON_RETRY_CONFIG
  );

export interface CreateCrossChainExchangeInput {
  coinFrom: string;
  networkFrom: string;
  coinTo: string;
  networkTo: string;
  /** Pass a stringifies BigNumber to preserve precision for 18-decimal tokens. */
  amount: string;
  withdrawalAddress: string;
}

export const createCrossChainExchange = (input: CreateCrossChainExchangeInput): Promise<ExchangeData> =>
  api
    .post<ExchangeData>('/transactions', {
      ...input,
      withdrawalExtraId: '',
      rateType: 'float'
    })
    .then(r => r.data);

export const getCrossChainExchangeStatus = (exchangeId: string): Promise<ExchangeData> =>
  retry(() => api.get<ExchangeData>(`/transactions/${exchangeId}`).then(r => r.data), COMMON_RETRY_CONFIG);
