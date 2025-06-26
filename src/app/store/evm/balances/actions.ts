import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LoadOnChainBalancePayload } from 'lib/evm/on-chain/balance';
import { createActions } from 'lib/store';
import { EvmNetworkEssentials } from 'temple/networks';

import { BalancesResponse } from '../types';

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

export const processLoadedEvmAssetsBalancesAction = createAction<ProcessLoadedEvmTokensBalancesActionPayload>(
  'evm/balances/PROCESS_LOADED_ASSETS_BALANCES_ACTION'
);

export const processLoadedOnchainBalancesAction = createAction<ProcessLoadedOnChainBalancesActionPayload>(
  'evm/balances/PROCESS_LOADED_ONCHAIN_BALANCES_ACTION'
);

export const loadEvmBalanceOnChainActions = createActions<LoadOnChainBalancePayload, LoadOnChainBalanceSuccessPayload>(
  'evm/balances/LOAD_BALANCE_ON_CHAIN'
);
