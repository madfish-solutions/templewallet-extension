import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store/action.utils';

interface BalancesTzktPayloadSubmit {
  publicKeyHash: string;
  chainId: string;
}
interface BalancesPayloadSuccess extends BalancesTzktPayloadSubmit {
  balances: StringRecord;
}
interface BalancesPayloadFail extends BalancesTzktPayloadSubmit {
  error: string;
}

export const loadTokensBalancesFromTzktAction = createActions<
  BalancesTzktPayloadSubmit,
  BalancesPayloadSuccess,
  BalancesPayloadFail
>('balances/LOAD_TOKENS_BALANCES');

export const putTokensBalancesAction = createAction<BalancesPayloadSuccess>('balances/PUT_TOKENS_BALANCES');
