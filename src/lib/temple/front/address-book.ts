import { useCallback, useMemo } from "react";

import { t } from "lib/i18n/react";
import {
  TempleAccount,
  TempleAccountType,
  useChainId,
  useStorage,
  useRelevantAccounts,
} from "lib/temple/front";

const ADDRESS_BOOK_CAPACITY = 10;

type AddressBookEntry = {
  address: string;
  lastUsed: number;
};

export function useAddressBook() {
  const chainId = useChainId();
  const [entries, setEntries] = useStorage<AddressBookEntry[]>(
    `address_book_${chainId}`,
    []
  );
  const allAccounts = useRelevantAccounts();

  const onAddressUsage = useCallback(
    async (address: string) => {
      const entryIndex = entries.findIndex(
        ({ address: entryAddress }) => entryAddress === address
      );
      let newEntries: AddressBookEntry[] = [...entries];
      if (entryIndex === -1) {
        newEntries = [
          {
            address,
            lastUsed: Date.now(),
          },
          ...newEntries.slice(0, ADDRESS_BOOK_CAPACITY - 1),
        ];
      } else {
        newEntries[entryIndex].lastUsed = Date.now();
      }
      await setEntries(
        newEntries.sort(
          ({ lastUsed: aLastUsed }, { lastUsed: bLastUsed }) =>
            bLastUsed - aLastUsed
        )
      );
    },
    [entries, setEntries]
  );

  const accounts = useMemo<TempleAccount[]>(
    () =>
      entries.map(({ address }) => {
        const knownAccount = allAccounts.find(
          ({ publicKeyHash }) => publicKeyHash === address
        );
        return (
          knownAccount ?? {
            type: TempleAccountType.WatchOnly,
            name: t("unknownAccount"),
            publicKeyHash: address,
          }
        );
      }),
    [allAccounts, entries]
  );

  return { accounts, onAddressUsage };
}
