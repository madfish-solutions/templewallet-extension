import { useCallback, useMemo } from "react";

import { getMessage } from "lib/i18n";
import {
  TempleContact,
  useStorage,
  useRelevantAccounts,
} from "lib/temple/front";

export function useContacts() {
  const allAccounts = useRelevantAccounts();
  const accountContacts = useMemo<TempleContact[]>(
    () =>
      allAccounts.map((acc) => ({
        address: acc.publicKeyHash,
        name: acc.name,
        accountInWallet: true,
      })),
    [allAccounts]
  );

  const [savedContacts, setSavedContacts] = useStorage<TempleContact[]>(
    "contacts",
    []
  );

  const allContacts = useMemo(
    () => [...savedContacts, ...accountContacts],
    [savedContacts, accountContacts]
  );

  const addContact = useCallback(
    (cToAdd: TempleContact) => {
      if (allContacts.some((c) => c.address === cToAdd.address)) {
        throw new Error(getMessage("contactWithTheSameAddressAlreadyExists"));
      }

      return setSavedContacts((cnts) => [cToAdd, ...cnts]);
    },
    [allContacts, setSavedContacts]
  );

  const removeContact = useCallback(
    (address: string) =>
      setSavedContacts((cnts) => cnts.filter((c) => c.address !== address)),
    [setSavedContacts]
  );

  const getContact = useCallback(
    (address: string) => allContacts.find((c) => c.address === address) ?? null,
    [allContacts]
  );

  const findContacts = useCallback(
    (term: string) =>
      allContacts.filter(
        (c) => c.name.includes(term) || c.address.includes(term)
      ),
    [allContacts]
  );

  return {
    allContacts,
    accountContacts,
    savedContacts,
    addContact,
    removeContact,
    getContact,
    findContacts,
  };
}
