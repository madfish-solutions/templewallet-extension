import { TEZOS_METADATA } from 'lib/metadata';

export const getCurrencyDisplayCode = (currencyCode: string) =>
  currencyCode === 'XTZ' ? TEZOS_METADATA.symbol : currencyCode;
