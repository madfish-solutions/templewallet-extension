import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
interface proceedLoadedEvmExchangeRatesActionPayload {
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmExchangeRatesAction = createAction<proceedLoadedEvmExchangeRatesActionPayload>(
  'evm/PROCEED_LOADED_EVM_EXCHANGE_RATES_ACTION'
);
