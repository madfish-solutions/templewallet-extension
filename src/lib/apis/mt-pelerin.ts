import axios from 'axios';
import { isHex } from 'viem';

import { EnvVars } from 'lib/env';
import { getCurrentLocale } from 'lib/i18n';

const api = axios.create({ baseURL: 'https://api.mtpelerin.com' });

const MT_PELERIN_WIDGET_URL = 'https://widget.mtpelerin.com/';
const MT_PELERIN_SUPPORTED_LANGS = new Set(['en', 'fr', 'de', 'it', 'es', 'pt']);
const MT_PELERIN_PRIMARY_COLOR = '#1373E4';
const MT_PELERIN_LOGO_URL =
  'https://cdn.prod.website-files.com/650900ffe9db068e47c2b612/67f3c559e2132028a21c5c21_Sketches.svg';

interface MtPelerinQuote {
  fees: {
    networkFee: string | number;
    fixFee: string | number;
  };
  destAmount: string;
}

interface MtPelerinSellLimitResponse {
  destCurrency: string;
  limit: string | number;
}

interface BuildMtPelerinBuyUrlParams {
  fiatCode: string;
  cryptoCode: string;
  sourceAmount: number;
  network: string;
  accountPkh: string;
  code: string;
  signature: string;
}

const getMtPelerinLang = () => {
  const localeBase = getCurrentLocale().split(/[-_]/)[0]?.toLowerCase();

  return localeBase && MT_PELERIN_SUPPORTED_LANGS.has(localeBase) ? localeBase : 'en';
};

export const buildMtPelerinBuyUrl = ({
  fiatCode,
  cryptoCode,
  sourceAmount,
  network,
  accountPkh,
  code,
  signature
}: BuildMtPelerinBuyUrlParams) => {
  const url = new URL(MT_PELERIN_WIDGET_URL);

  url.searchParams.set('_ctkn', EnvVars.MT_PELERIN_ACTIVATION_KEY);
  url.searchParams.set('type', 'direct-link');
  url.searchParams.set('lang', getMtPelerinLang());
  url.searchParams.set('tab', 'buy');
  url.searchParams.set('tabs', 'buy');
  url.searchParams.set('rfr', EnvVars.MT_PELERIN_REF_CODE);
  url.searchParams.set('bsc', fiatCode);
  url.searchParams.set('bdc', cryptoCode);
  url.searchParams.set('bsa', String(sourceAmount));
  url.searchParams.set('curs', fiatCode);
  url.searchParams.set('crys', cryptoCode);
  url.searchParams.set('dnet', network);
  url.searchParams.set('nets', network);
  url.searchParams.set('pm', 'card');
  url.searchParams.set('primary', MT_PELERIN_PRIMARY_COLOR);
  url.searchParams.set('mylogo', MT_PELERIN_LOGO_URL);
  url.searchParams.set('addr', accountPkh);
  url.searchParams.set('code', code);
  // TODO: Figure out correct encoding for Tezos signature
  url.searchParams.set(
    'hash',
    isHex(signature)
      ? Buffer.from(signature.slice(2), 'hex').toString('base64')
      : Buffer.from(signature, 'utf-8').toString('base64')
  );

  return url.toString();
};

export const getMtPelerinConvertQuote = async (
  sourceCurrency: string,
  destCurrency: string,
  sourceAmount: number,
  destNetwork: string
) => {
  const { data } = await api.post<MtPelerinQuote>('/currency_rates/convert', {
    sourceCurrency,
    destCurrency,
    sourceAmount,
    sourceNetwork: 'fiat',
    destNetwork,
    isCardPayment: true
  });

  return data;
};

export const getMtPelerinOutputAmount = async (
  sourceCurrency: string,
  destCurrency: string,
  sourceAmount: number,
  destNetwork: string
) => {
  const { destAmount } = await getMtPelerinConvertQuote(sourceCurrency, destCurrency, sourceAmount, destNetwork);

  return Number(destAmount);
};

export const getMtPelerinSellLimit = async (currency: string) => {
  const { data } = await api.get<MtPelerinSellLimitResponse>(`/currency_rates/sellLimits/${currency}`);

  return Number(data.limit);
};
