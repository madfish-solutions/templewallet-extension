import { createActions } from 'lib/store/action.utils';

interface BalancesTzktPayloadSubmit {
  publicKeyHash: string;
  chainId: string;
}
interface BalancesPayloadSuccess extends BalancesTzktPayloadSubmit {
  balances: Record<string, string>;
}
interface NativeTokenBalancePayloadSuccess extends BalancesTzktPayloadSubmit {
  balance: string;
}
interface BalancesPayloadFail extends BalancesTzktPayloadSubmit {
  error: string;
}

export const loadNativeTokenBalanceFromTzktAction = createActions<
  BalancesTzktPayloadSubmit,
  NativeTokenBalancePayloadSuccess,
  BalancesPayloadFail
>('balances/LOAD_NATIVE_TOKEN_BALANCE');

export const loadTokensBalancesFromTzktAction = createActions<
  BalancesTzktPayloadSubmit,
  BalancesPayloadSuccess,
  BalancesPayloadFail
>('balances/LOAD_TOKENS_BALANCES');
