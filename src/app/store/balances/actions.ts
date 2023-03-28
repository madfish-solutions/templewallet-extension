import { createActions } from 'lib/store/utils/action.utils';
import { IAccountToken } from 'lib/temple/repo';

interface BalancesPayloadAbstract {
  publicKeyHash: string;
  chainId: string;
}
interface BalancesPayloadSuccess extends BalancesPayloadAbstract {
  balances: Record<string, string>;
}
interface BalancesPayloadFail extends BalancesPayloadAbstract {
  error: string;
}

interface BalancesTzktPayloadSubmit extends BalancesPayloadAbstract {
  apiUrl: string;
}

export const loadTokensBalancesFromTzktAction = createActions<
  BalancesTzktPayloadSubmit,
  BalancesPayloadSuccess,
  BalancesPayloadFail
>('balances/LOAD_TOKENS_BALANCES');

interface BalancesChainPayloadSubmit extends BalancesPayloadAbstract {
  rpcUrl: string;
  tokens: Array<IAccountToken>;
}
export const loadTokensBalancesFromChainAction = createActions<
  BalancesChainPayloadSubmit,
  BalancesPayloadSuccess,
  BalancesPayloadFail
>('balances/LOAD_TEZOS_BALANCE');
