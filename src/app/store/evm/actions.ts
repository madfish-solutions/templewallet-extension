import { createAction } from '@reduxjs/toolkit';

import { LoadableState } from 'lib/store/entity.utils';

import { EvmBalancesSource } from './state';

interface SetEvmBalancesLoadingStateData extends LoadableState {
  chainId: number;
  source: EvmBalancesSource;
}

export const setEvmBalancesLoadingState = createAction<SetEvmBalancesLoadingStateData>(
  'evm/loading/SET_BALANCES_LOADING_STATE'
);

export const setEvmTokensMetadataLoading = createAction<boolean>('evm/loading/SET_TOKENS_METADATA_LOADING');

export const setEvmCollectiblesMetadataLoading = createAction<boolean>('evm/loading/SET_COLLECTIBLES_METADATA_LOADING');

export const setEvmTokensExchangeRatesLoading = createAction<{ chainId: number; isLoading: boolean }>(
  'evm/loading/SET_TOKENS_EXCHANGE_RATES_LOADING'
);
