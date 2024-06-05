import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

interface processLoadedEvmExchangeRatesActionPayload {
  chainId: number;
  data: BalancesResponse;
}

export const processLoadedEvmExchangeRatesAction = createAction<processLoadedEvmExchangeRatesActionPayload>(
  'evm/PROCESS_LOADED_EVM_EXCHANGE_RATES_ACTION'
);
