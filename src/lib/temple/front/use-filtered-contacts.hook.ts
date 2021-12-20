import { useMemo } from 'react';

import { TempleContact } from '../types';
import { useTempleClient } from './client';
import { useRelevantAccounts, useSettings } from './ready';

export function useFilteredContacts() {
  const { contacts = [] } = useSettings();
  const { updateSettings } = useTempleClient();
  const allAccounts = useRelevantAccounts();

  const accountContacts = useMemo<TempleContact[]>(
    () =>
      allAccounts.map(acc => ({
        address: acc.publicKeyHash,
        name: acc.name,
        accountInWallet: true
      })),
    [allAccounts]
  );

  const intersections = useMemo<TempleContact[]>(
    () =>
      contacts.filter(contact => accountContacts.some(accountContact => contact.address === accountContact.address)),
    [contacts, accountContacts]
  );

  if (intersections.length > 0) {
    let filteredContacts;

    for (let intersection of intersections) {
      filteredContacts = contacts.filter(contact => contact.address !== intersection.address);
    }
    (async () => await updateSettings({ contacts: filteredContacts }))();
    return { filteredContacts, accountContacts };
  }

  return { contacts, accountContacts };
}
