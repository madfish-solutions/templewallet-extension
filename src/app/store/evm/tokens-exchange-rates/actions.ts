import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from '../types';

interface ProcessLoadedEvmExchangeRatesActionPayload {
  chainId: number;
  data: BalancesResponse;
  timestamp: number;
}

export const processLoadedEvmExchangeRatesAction = createAction<ProcessLoadedEvmExchangeRatesActionPayload>(
  'evm/tokens-exchange-rates/PROCESS_LOADED_EVM_EXCHANGE_RATES_ACTION'
);
