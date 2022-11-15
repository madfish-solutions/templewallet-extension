import { createActions } from '../create-actions';
import { ExchangeRateRecord } from './state';

interface ExchangeRateInterface {
  usdToTokenRates: ExchangeRateRecord;
  fiatToTezosRates: ExchangeRateRecord<number>;
}

export const loadExchangeRates = createActions<void, ExchangeRateInterface, string>('currency/LOAD_EXCHANGE_RATES');
