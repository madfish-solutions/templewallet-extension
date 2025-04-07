import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

interface ProcessLoadedEvmExchangeRatesActionPayload {
  chainId: number;
  data: BalancesResponse;
  timestamp: number;
}

export const processLoadedEvmExchangeRatesAction = createAction<ProcessLoadedEvmExchangeRatesActionPayload>(
  'evm/tokens-exchange-rates/PROCESS_LOADED_EVM_EXCHANGE_RATES_ACTION'
);
