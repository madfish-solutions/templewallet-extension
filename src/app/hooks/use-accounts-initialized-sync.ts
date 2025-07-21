import { useCallback, useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import {
  forgetIsAccountInitializedAction,
  loadIsAccountInitializedActions
} from 'app/store/accounts-initialization/actions';
import { useAccountsInitializedState } from 'app/store/accounts-initialization/selectors';
import { useAllRawEvmBalancesSelector } from 'app/store/evm/balances/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { parseKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { StoredAccount } from 'lib/temple/types';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useAllAccounts } from 'temple/front';

export const useAccountsInitializedSync = () => {
  const state = useAccountsInitializedState();
  const accounts = useAllAccounts();
  const rawEvmBalances = useAllRawEvmBalancesSelector();
  const rawTezBalances = useBalancesAtomicRecordSelector();
  const accountsIdsWithAttempts = useRef(new Set<string>());

  const getHasStoredBalances = useCallback(
    (account: StoredAccount) => {
      const evmAddress = getAccountAddressForEvm(account);
      const accountEvmBalances = (evmAddress && rawEvmBalances[evmAddress]) ?? {};
      for (const chainId in accountEvmBalances) {
        const chainBalances = accountEvmBalances[Number(chainId)] ?? {};
        for (const slug in chainBalances) {
          if (chainBalances[slug] && chainBalances[slug] !== '0') {
            return true;
          }
        }
      }

      const tezosAddress = getAccountAddressForTezos(account);
      for (const key in rawTezBalances) {
        const [publicKeyHash, chainId] = parseKeyForBalancesRecord(key);

        if (publicKeyHash !== tezosAddress || !chainId) {
          continue;
        }

        const tezBalances = rawTezBalances[key]?.data ?? {};
        for (const slug in tezBalances) {
          if (tezBalances[slug] && tezBalances[slug] !== '0') {
            return true;
          }
        }
      }

      return false;
    },
    [rawEvmBalances, rawTezBalances]
  );

  useEffect(() => {
    for (const account of accounts) {
      const { id: accountId } = account;
      if (state[accountId]?.data !== true && getHasStoredBalances(account)) {
        dispatch(
          loadIsAccountInitializedActions.success({
            id: accountId,
            initialized: true
          })
        );
      } else if (state[accountId]?.data === undefined && !accountsIdsWithAttempts.current.has(accountId)) {
        accountsIdsWithAttempts.current.add(accountId);
        dispatch(
          loadIsAccountInitializedActions.submit({
            id: accountId,
            evmAddress: getAccountAddressForEvm(account),
            tezosAddress: getAccountAddressForTezos(account)
          })
        );
      }
    }

    const existentAccountsIds = new Set(accounts.map(({ id }) => id));
    const accountsIdsToForget = Object.keys(state).filter(accountId => !existentAccountsIds.has(accountId));
    accountsIdsToForget.forEach(accountId => accountsIdsWithAttempts.current.delete(accountId));

    if (accountsIdsToForget.length) {
      dispatch(forgetIsAccountInitializedAction(accountsIdsToForget));
    }
  }, [accounts, getHasStoredBalances, state]);
};
