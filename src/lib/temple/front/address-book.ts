import { useCallback, useMemo } from 'react';

import { getMessage } from 'lib/i18n';
import { TempleContact, useRelevantAccounts, useSettings, useTempleClient } from 'lib/temple/front';

export function useContacts() {
  const { updateSettings } = useTempleClient();
  const { contacts = [] } = useSettings();
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

  const allContacts = useMemo(() => [...contacts, ...accountContacts], [contacts, accountContacts]);

  const addContact = useCallback(
    async (cToAdd: TempleContact) => {
      if (allContacts.some(c => c.address === cToAdd.address)) {
        throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
      }

      await updateSettings({
        contacts: [
          {
            address: cToAdd.address,
            name: cToAdd.name,
            addedAt: cToAdd.addedAt,
            accountInWallet: cToAdd.accountInWallet
          },
          ...contacts
        ]
      });
    },
    [contacts, allContacts, updateSettings]
  );

  const removeContact = useCallback(
    (address: string) =>
      void updateSettings({
        contacts: contacts.filter(c => c.address !== address)
      }),
    [contacts, updateSettings]
  );

  const getContact = useCallback(
    (address: string) => allContacts.find(c => c.address === address) ?? null,
    [allContacts]
  );

  return {
    allContacts,
    accountContacts,
    addContact,
    removeContact,
    getContact
  };
}

export const CONTACT_FIELDS_TO_SEARCH = ['name', 'address'] as const;

export function searchContacts<T extends TempleContact>(contacts: T[], searchValue: string) {
  if (!searchValue) return contacts;

  const loweredSearchValue = searchValue.toLowerCase();
  return contacts.filter(c =>
    CONTACT_FIELDS_TO_SEARCH.some(field => c[field].toLowerCase().includes(loweredSearchValue))
  );
}
