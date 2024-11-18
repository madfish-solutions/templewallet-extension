import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from 'lib/evm/types';
import { createActions } from 'lib/store';
import { EvmNetworkEssentials } from 'temple/networks';

interface processLoadedEvmTokensBalancesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

export interface LoadOnChainBalancePayload {
  network: EvmNetworkEssentials;
  assetSlug: string;
  account: HexString;
  assetStandard?: EvmAssetStandard;
}

interface LoadOnChainBalanceSuccessPayload extends Omit<LoadOnChainBalancePayload, 'assetStandard'> {
  balance: BigNumber;
}

export const processLoadedEvmAssetsBalancesAction = createAction<processLoadedEvmTokensBalancesActionPayload>(
  'evm/balances/PROCESS_LOADED_ASSETS_BALANCES_ACTION'
);

export const loadEvmBalanceOnChainActions = createActions<LoadOnChainBalancePayload, LoadOnChainBalanceSuccessPayload>(
  'evm/balances/LOAD_BALANCE_ON_CHAIN'
);
