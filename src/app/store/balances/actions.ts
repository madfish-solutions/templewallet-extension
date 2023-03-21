import { createActions } from 'lib/store/utils/action.utils';
import { IAccountToken } from 'lib/temple/repo';

export const loadTokensBalancesFromTzktAction = createActions<
  { apiUrl: string; publicKeyHash: string; chainId: string },
  { publicKeyHash: string; chainId: string; balances: Record<string, string> },
  { publicKeyHash: string; chainId: string; error: string }
>('balances/LOAD_TOKENS_BALANCES');

export const loadTokensBalancesFromChainAction = createActions<
  { rpcUrl: string; tokens: Array<IAccountToken>; publicKeyHash: string; chainId: string },
  { publicKeyHash: string; chainId: string; balances: Record<string, string> },
  { publicKeyHash: string; chainId: string; error: string }
>('balances/LOAD_TEZOS_BALANCE');
