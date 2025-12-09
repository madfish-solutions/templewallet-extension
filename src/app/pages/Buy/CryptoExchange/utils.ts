import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';
import { TEZOS_METADATA } from 'lib/metadata';

import { TEZOS_EXOLIX_NETWORK_CODE } from './config';

export const getCurrencyDisplayCode = (currencyCode: string) =>
  currencyCode === TEZOS_EXOLIX_NETWORK_CODE ? TEZOS_METADATA.symbol : currencyCode;

export const isSameExolixCurrency = (a: StoredExolixCurrency, b: StoredExolixCurrency): boolean =>
  a.code === b.code && a.network.code === b.network.code;
