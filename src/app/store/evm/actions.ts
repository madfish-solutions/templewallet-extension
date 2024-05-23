import { createAction } from '@reduxjs/toolkit';

export const setEvmBalancesLoading = createAction<boolean>('evm/SET_BALANCES_LOADING');

export const setEvmTokensMetadataLoading = createAction<boolean>('evm/SET_TOKENS_METADATA_LOADING');

export const setEvmCollectiblesMetadataLoading = createAction<boolean>('evm/SET_COLLECTIBLES_METADATA_LOADING');

export const setEvmTokensExchangeRatesLoading = createAction<boolean>('evm/SET_TOKENS_EXCHANGE_RATES_LOADING');
