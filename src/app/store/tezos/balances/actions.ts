import { createAction } from '@reduxjs/toolkit';

import { TzktApiChainId } from 'lib/apis/tzkt';
import { createActions } from 'lib/store/action.utils';

interface LoadBalancesPayloadBase {
  publicKeyHash: string;
  chainId: TzktApiChainId;
}

interface LoadBalancesSubmitPayload extends LoadBalancesPayloadBase {}

interface LoadBalancesSuccessPayload extends LoadBalancesPayloadBase {
  balances: StringRecord;
}

interface LoadBalancesFailPayload extends LoadBalancesPayloadBase {
  error: string;
}

export const loadGasBalanceActions = createActions<
  LoadBalancesSubmitPayload,
  LoadBalancesPayloadBase & { balance: string },
  LoadBalancesFailPayload
>('balances/LOAD_GAS_BALANCE');

export const loadAssetsBalancesActions = createActions<
  LoadBalancesSubmitPayload,
  LoadBalancesSuccessPayload,
  LoadBalancesFailPayload
>('balances/LOAD_ASSETS_BALANCES');

export const putTokensBalancesAction = createAction<LoadBalancesSuccessPayload>('balances/PUT_TOKENS_BALANCES');
