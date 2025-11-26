import { createAction } from '@reduxjs/toolkit';

import { LifiEvmTokenMetadata } from 'lib/metadata/types';

import { BalancesResponse } from '../types';

interface ProcessLoadedEvmExchangeRatesActionPayload {
  chainId: number;
  data: BalancesResponse | { lifiItems: LifiEvmTokenMetadata[] };
  timestamp: number;
}

export const processLoadedEvmExchangeRatesAction = createAction<ProcessLoadedEvmExchangeRatesActionPayload>(
  'evm/tokens-exchange-rates/PROCESS_LOADED_EVM_EXCHANGE_RATES_ACTION'
);
