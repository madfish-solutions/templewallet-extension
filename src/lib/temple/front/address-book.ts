import { useCallback, useMemo } from 'react';

import { isString } from 'lodash';

import { getMessage } from 'lib/i18n';
import { TempleContact } from 'lib/temple/types';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useAllAccounts, useSettings } from 'temple/front/ready';

import { useTempleClient } from './client';

export function useContactsActions() {
  const { updateSettings } = useTempleClient();
  const { contacts } = useSettings();
  const allAccounts = useAllAccounts();

  const allAccountsAddresses = useMemo(
    () => allAccounts.flatMap(acc => [getAccountAddressForEvm(acc), getAccountAddressForTezos(acc)].filter(isString)),
    [allAccounts]
  );

  const contactsWithFallback = useMemo(() => contacts ?? [], [contacts]);

  const addContact = useCallback(
    async (contactToAdd: TempleContact) => {
      checkForContactDuplication(contactsWithFallback, allAccountsAddresses, contactToAdd.address);

      await updateSettings({
        contacts: [contactToAdd, ...contactsWithFallback]
      });
    },
    [allAccountsAddresses, contactsWithFallback, updateSettings]
  );

  const editContact = useCallback(
    async (address: string, editedData: Pick<TempleContact, 'name' | 'address'>) => {
      if (address !== editedData.address) {
        checkForContactDuplication(contactsWithFallback, allAccountsAddresses, editedData.address);
      }

      const newContacts = [...contactsWithFallback];

      const index = contactsWithFallback.findIndex(c => c.address === address);

      if (index === -1) {
        throw new Error('Failed to find a contact to edit');
      }

      const currentContact = contactsWithFallback[index];

      newContacts[index] = { ...currentContact, ...editedData };

      await updateSettings({
        contacts: newContacts
      });
    },
    [allAccountsAddresses, contactsWithFallback, updateSettings]
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

const checkForContactDuplication = (contacts: TempleContact[], allAccountsAddresses: string[], address: string) => {
  if (contacts.some(c => c.address === address)) {
    throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
  }
  if (allAccountsAddresses.some(a => a === address)) {
    throw new Error(getMessage('accountWithTheSameAddressAlreadyExists'));
  }
};
