import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';
import { TEZOS_METADATA } from 'lib/metadata';

export const getCurrencyDisplayCode = (currency: StoredExolixCurrency) =>
  currency.code === 'XTZ' ? TEZOS_METADATA.symbol : currency.code;
