import { useEffect, useMemo } from 'react';

import { usePassiveStorage } from 'lib/temple/front/storage';
import { TempleNotification, TempleMessageType, StoredAccount } from 'lib/temple/types';
import { useMemoWithCompare, useUpdatableRef } from 'lib/ui/hooks';
import { getAccountAddressForTezos, getAccountForEvm, getAccountForTezos } from 'temple/accounts';
import { intercomClient } from 'temple/front/intercom-client';

export function useReadyTempleAccounts(allAccounts: NonEmptyArray<StoredAccount>) {
  const allAccountsRef = useUpdatableRef(allAccounts);

  const defaultAcc = allAccounts[0];

  const [accountId, setAccountId] = usePassiveStorage('CURRENT_ACCOUNT_ID', defaultAcc.id);

  useEffect(() => {
    return intercomClient.subscribe((msg: TempleNotification) => {
      switch (msg?.type) {
        case TempleMessageType.SelectedAccountChanged:
          const account = allAccountsRef.current.find(
            acc => getAccountAddressForTezos(acc) === msg.accountPublicKeyHash
          );
          if (account) setAccountId(account.id);
          break;
      }
    });
  }, [setAccountId, allAccountsRef]);

  useEffect(() => {
    if (allAccounts.every(a => a.id !== accountId)) {
      setAccountId(defaultAcc.id);
    }
  }, [allAccounts, defaultAcc, accountId, setAccountId]);

  const account = useMemoWithCompare(
    () => allAccounts.find(a => a.id === accountId) ?? defaultAcc,
    [allAccounts, defaultAcc, accountId]
  );

  const accountForTezos = useMemo(() => getAccountForTezos(account), [account]);
  const accountAddressForTezos = accountForTezos?.address;
  const accountForEvm = useMemo(() => getAccountForEvm(account), [account]);
  const accountAddressForEvm = accountForEvm?.address as HexString | undefined;

  return {
    allAccounts,
    accountId,
    account,
    accountAddressForTezos,
    accountForTezos,
    accountAddressForEvm,
    accountForEvm,
    setAccountId
  };
}
