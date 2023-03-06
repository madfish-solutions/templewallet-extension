import { createActions } from 'lib/store/utils/action.utils';
import { IAccountToken } from 'lib/temple/repo';

export const loadTokensBalancesFromTzktAction = createActions<
  { apiUrl: string; accountPublicKeyHash: string },
  Record<string, string>,
  string
>('balances/LOAD_TOKENS_BALANCES');

export const loadTokensBalancesFromChainAction = createActions<
  { rpcUrl: string; tokens: Array<IAccountToken>; accountPublicKeyHash: string },
  Record<string, string>,
  string
>('balances/LOAD_TEZOS_BALANCE');
