import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';

export interface CryptoExchangeFormData {
  inputValue: string;
  inputCurrency: StoredExolixCurrency;
  outputCurrency: StoredExolixCurrency;
}
