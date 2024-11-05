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
      if (contactsWithFallback.some(c => c.address === contactToAdd.address)) {
        throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
      }

      await updateSettings({
        contacts: [contactToAdd, ...contactsWithFallback]
      });
    },
    [contactsWithFallback, updateSettings]
  );

  const editContact = useCallback(
    async (contactToEdit: TempleContact) => {
      const newContacts = [...contactsWithFallback];

      const index = newContacts.findIndex(c => c.address === contactToEdit.address);

      if (index === -1) {
        throw new Error('Failed to find a contact to edit');
      }

      newContacts[index] = await updateSettings({
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
