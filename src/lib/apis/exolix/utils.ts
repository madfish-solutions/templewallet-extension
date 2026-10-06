import retry from 'async-retry';
import axios from 'axios';

import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';
import { templeWalletApi } from 'lib/apis/temple/endpoints/templewallet.api';

import {
  CrossChainRateRequestData,
  ExchangeData,
  ExolixCurrenciesResponse,
  GetRateRequestData,
  GetRateResponse,
  NormalizedRateResult
} from './types';

export const EXOLIX_DEPOSIT_WINDOW_MS = 25 * 60 * 1000;

/** Due to legal restrictions */
const MAX_DOLLAR_VALUE = 10000;
const MIN_ASSET_AMOUNT = 0.00001;
const AVG_COMISSION = 300;

const COMMON_RETRY_CONFIG = { retries: 5, minTimeout: 250, maxTimeout: 1000 };

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
      templeWalletApi
        .get<ExolixCurrenciesResponse>('/exolix/currencies', {
          params: { size: currenciesLimit, page, withNetworks: true }
        })
        .then(r => r.data),
    COMMON_RETRY_CONFIG
  );

const loadUSDTRate = async (coinTo: string, networkTo: string) => {
  const exchangeData = {
    coinTo,
    networkTo,
    coinFrom: 'USDT',
    networkFrom: 'ETH',
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
      networkTo: outputAssetNetwork,
      coinFrom: inputAssetCode,
      networkFrom: inputAssetNetwork,
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

        if (!('minAmount' in minAmountExchangeResponse)) {
          throw new Error('Failed to get minimal input amount');
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
      networkTo: inputAssetNetwork,
      coinFrom: outputAssetCode,
      networkFrom: outputAssetNetwork,
      amount: (MAX_DOLLAR_VALUE + AVG_COMISSION) / outputTokenPrice
    });
    // Ignoring the invalid output of the backward exchange
    const maxDollarValueMaxAmount =
      'message' in backwardExchange && backwardExchange.message == null && backwardExchange.toAmount >= finalMinAmount
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
      templeWalletApi.get<GetRateResponse>('/exolix/rate', { params: { ...data, rateType: 'fixed' } }).then(
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
}) =>
  retry(
    () => templeWalletApi.post('/exolix/transactions', { ...data, rateType: 'fixed' }).then(r => r.data),
    COMMON_RETRY_CONFIG
  );

export const getExchangeData = (exchangeId: string) =>
  retry(
    () => templeWalletApi.get<ExchangeData>(`/exolix/transactions/${encodeURIComponent(exchangeId)}`).then(r => r.data),
    COMMON_RETRY_CONFIG
  );

export const normalizeRateResponse = (raw: GetRateResponse): NormalizedRateResult => {
  if ('error' in raw) return { kind: 'unsupported' };

  const hasRate = 'rate' in raw;
  const hasMin = 'minAmount' in raw;
  const hasMax = 'maxAmount' in raw;

  if (hasRate && raw.message == null) {
    return {
      kind: 'ok',
      fromAmount: raw.fromAmount,
      toAmount: raw.toAmount,
      rate: raw.rate,
      minAmount: raw.minAmount,
      maxAmount: raw.maxAmount
    };
  }

  if (raw.message) {
    if (hasMin && !hasRate) return { kind: 'min-bound', minAmount: raw.minAmount, message: raw.message };
    if (hasMax && !hasRate) return { kind: 'max-bound', maxAmount: raw.maxAmount, message: raw.message };
  }

  return { kind: 'unknown' };
};

export const queryCrossChainRate = (data: CrossChainRateRequestData): Promise<GetRateResponse> =>
  retry(
    () =>
      templeWalletApi
        .get<GetRateResponse>('/exolix/rate', {
          params: { ...data, rateType: 'float' },
          validateStatus: status => status === 200 || status === 422
        })
        .then(r => r.data),
    COMMON_RETRY_CONFIG
  );

interface CreateCrossChainExchangeInput {
  coinFrom: string;
  networkFrom: string;
  coinTo: string;
  networkTo: string;
  /** Pass a stringifies BigNumber to preserve precision for 18-decimal tokens. */
  amount: string;
  withdrawalAddress: string;
  /** Exolix uses this to auto-refund when the exchange can't complete. */
  refundAddress: string;
}

export const createCrossChainExchange = (input: CreateCrossChainExchangeInput): Promise<ExchangeData> =>
  templeWalletApi
    .post<ExchangeData>('/exolix/transactions', {
      ...input,
      withdrawalExtraId: '',
      rateType: 'float'
    })
    .then(r => r.data);
