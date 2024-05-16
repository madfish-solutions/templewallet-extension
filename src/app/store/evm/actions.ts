import { createAction } from '@reduxjs/toolkit';

import { ChainID } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { createActions } from 'lib/store';

interface LoadSingleEvmChainDataSuccessPayload {
  chainId: ChainID;
}

interface LoadSingleEvmChainDataSubmitPayload extends LoadSingleEvmChainDataSuccessPayload {
  publicKeyHash: HexString;
}

interface LoadSingleEvmChainDataFailedPayload extends LoadSingleEvmChainDataSuccessPayload {
  error?: string;
}

export const setEvmBalancesLoading = createAction<boolean>('evm/SET_BALANCES_LOADING');

export const loadEvmTokensMetadataActions = createActions<
  LoadSingleEvmChainDataSubmitPayload,
  LoadSingleEvmChainDataSuccessPayload,
  LoadSingleEvmChainDataFailedPayload
>('evm/LOAD_EVM_TOKENS_METADATA_ACTIONS');

export const loadEvmCollectiblesMetadataActions = createActions<
  LoadSingleEvmChainDataSubmitPayload,
  LoadSingleEvmChainDataSuccessPayload,
  LoadSingleEvmChainDataFailedPayload
>('evm/LOAD_EVM_COLLECTIBLES_METADATA_ACTIONS');
