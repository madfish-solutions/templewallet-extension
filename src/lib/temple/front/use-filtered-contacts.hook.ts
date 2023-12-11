import { useEffect, useMemo } from 'react';

import { isEqual } from 'lodash';

import { useMemoWithCompare } from 'lib/ui/hooks';

import { TempleContact } from '../types';

import { useTempleClient } from './client';
import { useRelevantAccounts, useSettings } from './ready';

export function useFilteredContacts() {
  const { contacts } = useSettings();

  const accounts = useRelevantAccounts();
  const accountContacts = useMemo<TempleContact[]>(
    () =>
      accounts.map(acc => ({
        address: acc.publicKeyHash,
        name: acc.name,
        accountInWallet: true
      })),
    [accounts]
  );

  const filteredContacts = useMemoWithCompare(
    () =>
      contacts
        ? contacts.filter(({ address }) => !accountContacts.some(accContact => address === accContact.address))
        : [],
    [contacts, accountContacts],
    isEqual
  );

  const allContacts = useMemo(() => [...filteredContacts, ...accountContacts], [filteredContacts, accountContacts]);

  const { updateSettings } = useTempleClient();
  useEffect(() => {
    if (contacts && contacts.length !== filteredContacts.length) updateSettings({ contacts: filteredContacts });
  }, [contacts, filteredContacts, updateSettings]);

  return { contacts: filteredContacts, allContacts };
}
