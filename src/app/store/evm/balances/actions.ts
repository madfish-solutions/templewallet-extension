import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { LoadOnChainBalancePayload } from 'lib/evm/on-chain/balance';
import { createActions } from 'lib/store';
import { EvmNetworkEssentials } from 'temple/networks';

interface ProcessLoadedOnChainBalancesActionPayload {
  balances: StringRecord;
  timestamp: number;
  account: HexString;
  chainId: number;
}

interface ProcessLoadedEvmTokensBalancesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: BalancesResponse;
}

interface LoadOnChainBalanceSuccessPayload {
  network: EvmNetworkEssentials;
  assetSlug: string;
  account: HexString;
  balance: BigNumber;
  timestamp: number;
}

/* interface LoadManyEvmBalancesOnChainPayload extends Omit<LoadOnChainBalancePayload, 'assetSlug' | 'assetStandard'> {
  assets: Pick<LoadOnChainBalancePayload, 'assetSlug' | 'assetStandard'>[];
}

interface LoadManyEvmBalancesOnChainSuccessPayload extends Omit<LoadOnChainBalancePayload, 'assetSlug'> {}

interface LoadManyEvmBalancesOnChainErrorPayload extends Omit<LoadOnChainBalancePayload, 'assetSlug'> {
  error: string;
} */

export const processLoadedEvmAssetsBalancesAction = createAction<ProcessLoadedEvmTokensBalancesActionPayload>(
  'evm/balances/PROCESS_LOADED_ASSETS_BALANCES_ACTION'
);

export const processLoadedOnchainBalancesAction = createAction<ProcessLoadedOnChainBalancesActionPayload>(
  'evm/balances/PROCESS_LOADED_ONCHAIN_BALANCES_ACTION'
);

export const loadEvmBalanceOnChainActions = createActions<LoadOnChainBalancePayload, LoadOnChainBalanceSuccessPayload>(
  'evm/balances/LOAD_BALANCE_ON_CHAIN'
);

/* export const loadManyEvmBalancesOnChainActions = createActions<
  LoadManyEvmBalancesOnChainPayload,
  LoadManyEvmBalancesOnChainSuccessPayload,
  LoadManyEvmBalancesOnChainErrorPayload
>('evm/balances/LOAD_MANY_BALANCES_ON_CHAIN'); */
