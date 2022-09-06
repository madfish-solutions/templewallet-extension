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
      'X-AUTH-NONCE': new Date().toString()
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
      externalId: new Date().toString() + paymentCurrency + amount.toString()
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

export const getExchangeRate = (paymentAmount: number, fromCurrency: string) => {
  const finalPaymentAmount = paymentAmount === 0 ? 1 : paymentAmount;

  return convertFiatAmountToXtz(finalPaymentAmount, fromCurrency).then(
    res => Math.round((res / finalPaymentAmount) * 10000) / 10000
  );
};
export const getCurrenciesInfo = () =>
  api.post<{ data: utorgCurrencyInfo[] }>('/settings/currency').then(r => r.data.data);

export const getMinMaxExchangeValue = () =>
  getCurrenciesInfo().then(currenciesInfo => {
    const tezInfo = currenciesInfo.find(currencyInfo => currencyInfo.currency === 'XTZ')!;

    return { minAmount: tezInfo.withdrawalMin, maxAmount: tezInfo.withdrawalMax };
  });

export const getAvailableFiatCurrencies = () =>
  getCurrenciesInfo().then(currenciesInfo =>
    currenciesInfo
      .filter(currencyInfo => currencyInfo.type === currencyInfoType.FIAT)
      .map(currencyInfo => currencyInfo.currency)
  );
