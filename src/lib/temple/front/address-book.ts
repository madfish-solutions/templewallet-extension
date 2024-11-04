import { useCallback } from 'react';

import { getMessage } from 'lib/i18n';
import { TempleContact } from 'lib/temple/types';

import { useTempleClient } from './client';
import { useFilteredContacts } from './use-filtered-contacts.hook';

export function useContactsActions() {
  const { updateSettings } = useTempleClient();
  const { contacts, allContacts } = useFilteredContacts();

  const addContact = useCallback(
    async (cToAdd: TempleContact) => {
      if (allContacts.some(c => c.address === cToAdd.address)) {
        throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
      }

      await updateSettings({
        contacts: [cToAdd, ...contacts]
      });
    },
    [contacts, allContacts, updateSettings]
  );

  const removeContact = useCallback(
    (address: string) =>
      updateSettings({
        contacts: contacts.filter(c => c.address !== address)
      }),
    [contacts, updateSettings]
  );

  const getContact = useCallback(
    (address: string) => allContacts.find(c => c.address === address) ?? null,
    [allContacts]
  );

  return {
    addContact,
    removeContact,
    getContact
  };
}
