import axios from 'axios';

enum currencyInfoType {
  CRYPTO = 'CRYPTO',
  FIAT = 'FIAT'
}

interface utorgCurrencyInfo {
  currency: string;
  symbol: string;
  chain: string;
  display: string;
  caption: string;
  explorerTx: string;
  explorerAddr: string;
  type: currencyInfoType;
  enabled: boolean;
  depositMin: number;
  depositMax: number;
  withdrawalMin: number;
  withdrawalMax: number;
  addressValidator: string;
  precision: number;
  allowTag: boolean;
}

const SID = process.env.TEMPLE_WALLET_UTORG_SID;

const api = axios.create({
  baseURL: 'https://app.utorg.pro/api/merchant/v1',
  ...(SID && {
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-SID': SID,
      'X-AUTH-NONCE': Math.random().toString()
    }
  })
});

export const createOrder = (amount: number, paymentCurrency: string, address: string) =>
  api
    .post<{ data: { url: string } }>('/order/init', {
      type: 'FIAT_TO_CRYPTO',
      currency: 'XTZ',
      amount,
      paymentCurrency,
      address,
      externalId: Number(new Date()).toString() + paymentCurrency + amount.toString()
    })
    .then(r => r.data.data.url);

export const convertFiatAmountToXtz = (paymentAmount: number, fromCurrency: string) =>
  api
    .post<{ data: number }>('/tools/convert', {
      fromCurrency,
      paymentAmount,
      toCurrency: 'XTZ'
    })
    .then(r => r.data.data);

/**
 * @returns Tezos to currency exchange rate
 */
export const getExchangeRate = async (inputAmount: number, fromCurrency: string) => {
  if (!Number.isFinite(inputAmount) || inputAmount <= 0) return;

  return await convertFiatAmountToXtz(inputAmount, fromCurrency).then(res => inputAmount / res);
};

const getCurrenciesInfo = () => api.post<{ data: utorgCurrencyInfo[] }>('/settings/currency').then(r => r.data.data);

export const getMinMaxExchangeValue = (currency: string) =>
  getCurrenciesInfo().then(currenciesInfo => {
    const tezInfo = currenciesInfo.find(currencyInfo => currencyInfo.currency === currency);

    if (tezInfo == null) throw new Error('Unknown Utorg currency');

    return { minAmount: tezInfo.depositMin, maxAmount: tezInfo.depositMax };
  });

export const getAvailableFiatCurrencies = () =>
  getCurrenciesInfo().then(currenciesInfo =>
    currenciesInfo
      .filter(currencyInfo => currencyInfo.type === currencyInfoType.FIAT)
      .map(currencyInfo => currencyInfo.currency)
  );
