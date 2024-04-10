import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
interface proceedLoadedEVMExchangeRatesActionPayload {
  data: BalancesResponse[];
}

export const proceedLoadedEVMExchangeRatesAction = createAction<proceedLoadedEVMExchangeRatesActionPayload>(
  'evm/PROCEED_LOADED_EVM_EXCHANGE_RATES_ACTION'
);
