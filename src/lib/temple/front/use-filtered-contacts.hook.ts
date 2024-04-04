import { useEffect, useMemo } from 'react';

import { isTezosContractAddress } from 'lib/tezos';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { getAccountForTezos } from 'temple/accounts';

import type { TempleContact } from '../types';

import { useTempleClient } from './client';
import { useAllAccounts, useSettings } from './ready';

export function useFilteredContacts() {
  const { updateSettings } = useTempleClient();
  const { contacts } = useSettings();

  const accounts = useAllAccounts();

  const accountContacts = useMemo<TempleContact[]>(
    () =>
      accounts
        .map(acc => {
          const tezosAccount = getAccountForTezos(acc);

          return tezosAccount && !isTezosContractAddress(tezosAccount.address)
            ? {
                address: tezosAccount.address,
                name: tezosAccount.name,
                accountInWallet: true
              }
            : null;
        })
        .filter(isTruthy),
    [accounts]
  );

  const filteredContacts = useMemoWithCompare(
    () =>
      contacts
        ? contacts.filter(({ address }) => !accountContacts.some(accContact => address === accContact.address))
        : [],
    [contacts, accountContacts]
  );

  const allContacts = useMemo(() => [...filteredContacts, ...accountContacts], [filteredContacts, accountContacts]);

  useEffect(() => {
    if (contacts && contacts.length !== filteredContacts.length) updateSettings({ contacts: filteredContacts });
  }, [contacts, filteredContacts, updateSettings]);

  return { contacts: filteredContacts, allContacts };
}
