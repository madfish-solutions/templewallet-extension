import { useCallback } from "react";

import { getMessage } from "lib/i18n";
import { TempleContact, useStorage } from "lib/temple/front";

export function useContacts() {
  const [contacts, setContacts] = useStorage<TempleContact[]>("contacts", []);

  const addContact = useCallback(
    (cToAdd: TempleContact) =>
      setContacts((cnts) => {
        if (cnts.some((c) => c.address === cToAdd.address)) {
          throw new Error(getMessage("contactWithTheSameAddressAlreadyExists"));
        }
        return [cToAdd, ...cnts];
      }),
    [setContacts]
  );

  const removeContact = useCallback(
    (address: string) =>
      setContacts((cnts) => cnts.filter((c) => c.address !== address)),
    [setContacts]
  );

  const getContact = useCallback(
    (address: string) => contacts.find((c) => c.address === address) ?? null,
    [contacts]
  );

  const findContacts = useCallback(
    (term: string) =>
      contacts.filter((c) => c.name.includes(term) || c.address.includes(term)),
    [contacts]
  );

  return { contacts, addContact, removeContact, getContact, findContacts };
}
