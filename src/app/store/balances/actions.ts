import { createActions } from 'lib/store/utils/action.utils';

interface BalancesTzktPayloadSubmit {
  publicKeyHash: string;
  chainId: string;
}
interface BalancesPayloadSuccess extends BalancesTzktPayloadSubmit {
  balances: Record<string, string>;
}
interface BalancesPayloadFail extends BalancesTzktPayloadSubmit {
  error: string;
}

export const loadTokensBalancesFromTzktAction = createActions<
  BalancesTzktPayloadSubmit,
  BalancesPayloadSuccess,
  BalancesPayloadFail
>('balances/LOAD_TOKENS_BALANCES');
