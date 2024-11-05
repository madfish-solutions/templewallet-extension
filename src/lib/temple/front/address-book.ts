import { useCallback, useMemo } from 'react';

import { getMessage } from 'lib/i18n';
import { TempleContact } from 'lib/temple/types';
import { useSettings } from 'temple/front/ready';

import { useTempleClient } from './client';

export function useContactsActions() {
  const { updateSettings } = useTempleClient();
  const { contacts } = useSettings();

  const contactsWithFallback = useMemo(() => contacts ?? [], [contacts]);

  const addContact = useCallback(
    async (contactToAdd: TempleContact) => {
      checkIfContactAlreadyExists(contactsWithFallback, contactToAdd.address);

      await updateSettings({
        contacts: [contactToAdd, ...contactsWithFallback]
      });
    },
    [contactsWithFallback, updateSettings]
  );

  const editContact = useCallback(
    async (editedData: Pick<TempleContact, 'name' | 'address'>) => {
      checkIfContactAlreadyExists(contactsWithFallback, editedData.address);

      const newContacts = [...contactsWithFallback];

      const index = newContacts.findIndex(c => c.address === editedData.address);

      if (index === -1) {
        throw new Error('Failed to find a contact to edit');
      }

      const currentContact = contactsWithFallback[index];

      newContacts[index] = { ...currentContact, ...editedData };

      await updateSettings({
        contacts: newContacts
      });
    },
    [contactsWithFallback, updateSettings]
  );

  const removeContact = useCallback(
    (address: string) =>
      updateSettings({
        contacts: contactsWithFallback.filter(c => c.address !== address)
      }),
    [contactsWithFallback, updateSettings]
  );

  return {
    addContact,
    editContact,
    removeContact
  };
}

const checkIfContactAlreadyExists = (contacts: TempleContact[], address: string) => {
  if (contacts.some(c => c.address === address)) {
    throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
  }
};
