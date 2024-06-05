import { createAction } from '@reduxjs/toolkit';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

interface processLoadedEvmTokensBalancesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export const processLoadedEvmAssetsBalancesAction = createAction<processLoadedEvmTokensBalancesActionPayload>(
  'evm/PROCESS_LOADED_ASSETS_BALANCES_ACTION'
);
