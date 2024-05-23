import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

interface proceedLoadedEvmAssetsActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const proceedLoadedEvmAssetsAction = createAction<proceedLoadedEvmAssetsActionPayload>(
  'evm/PROCEED_LOADED_ASSETS_ACTION'
);

interface putNewEvmAssetActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  assetSlug: string;
}

export const putNewEvmTokenAction = createAction<putNewEvmAssetActionPayload>('evm/PUT_NEW_TOKEN_ACTION');

export const putNewEvmCollectibleAction = createAction<putNewEvmAssetActionPayload>('evm/PUT_NEW_COLLECTIBLE_ACTION');
