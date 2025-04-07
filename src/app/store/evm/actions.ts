import { createAction } from '@reduxjs/toolkit';

import { LoadableState } from 'lib/store/entity.utils';

export const setEvmBalancesLoadingState = createAction<LoadableState & { chainId: number }>(
  'evm/loading/SET_BALANCES_LOADING_STATE'
);

export const setEvmTokensMetadataLoading = createAction<boolean>('evm/loading/SET_TOKENS_METADATA_LOADING');

export const setEvmCollectiblesMetadataLoading = createAction<boolean>('evm/loading/SET_COLLECTIBLES_METADATA_LOADING');

export const setEvmTokensExchangeRatesLoading = createAction<{ chainId: number; isLoading: boolean }>(
  'evm/loading/SET_TOKENS_EXCHANGE_RATES_LOADING'
);
