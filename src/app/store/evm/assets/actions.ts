import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from '../types';

import { EvmAccountAssetForStore } from './state';

interface processLoadedEvmAssetsActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const processLoadedEvmAssetsAction = createAction<processLoadedEvmAssetsActionPayload>(
  'evm/assets/PROCESS_LOADED_ASSETS_ACTION'
);

interface putNewEvmAssetActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  assetSlug: string;
}

export const putNewEvmTokenAction = createAction<putNewEvmAssetActionPayload>('evm/assets/PUT_NEW_TOKEN_ACTION');

export const putNewEvmCollectibleAction = createAction<putNewEvmAssetActionPayload>(
  'evm/assets/PUT_NEW_COLLECTIBLE_ACTION'
);

type SetAssetStatusPayload = EvmAccountAssetForStore;

export const setEvmTokenStatusAction = createAction<SetAssetStatusPayload>('evm/assets/SET_TOKEN_STATUS');

export const setEvmCollectibleStatusAction = createAction<SetAssetStatusPayload>('evm/assets/SET_COLLECTIBLE_STATUS');
