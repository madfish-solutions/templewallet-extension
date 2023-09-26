import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store/action.utils';

interface LoadBalancesPayloadBase {
  publicKeyHash: string;
  chainId: string;
}

interface LoadBalancesSubmitPayload extends LoadBalancesPayloadBase {
  gasOnly?: boolean;
}

interface LoadBalancesSuccessPayload extends LoadBalancesPayloadBase {
  balances: StringRecord;
}

interface LoadBalancesFailPayload extends LoadBalancesPayloadBase {
  error: string;
}

export const loadTokensBalancesFromTzktAction = createActions<
  LoadBalancesSubmitPayload,
  LoadBalancesSuccessPayload,
  LoadBalancesFailPayload
>('balances/LOAD_TOKENS_BALANCES');

export const putTokensBalancesAction = createAction<LoadBalancesSuccessPayload>('balances/PUT_TOKENS_BALANCES');
