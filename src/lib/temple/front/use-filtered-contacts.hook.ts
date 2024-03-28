import { useEffect, useMemo } from 'react';

import { isEqual } from 'lodash';

import { useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { getAccountForTezos } from 'temple/accounts';
import { useTezosNetwork, useRelevantAccounts } from 'temple/front';

import type { TempleContact } from '../types';

import { useTempleClient } from './client';
import { useSettings } from './ready';

export function useFilteredContacts() {
  const { updateSettings } = useTempleClient();
  const { contacts } = useSettings();

  const { chainId } = useTezosNetwork();
  const accounts = useRelevantAccounts(chainId);

  const accountContacts = useMemo<TempleContact[]>(
    () =>
      accounts
        .map(acc => {
          const tezosAccount = getAccountForTezos(acc);

          return tezosAccount
            ? {
                address: tezosAccount.address,
                name: tezosAccount.name,
                accountInWallet: true
              }
            : null;
        })
        .filter(isTruthy),
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

  useEffect(() => {
    if (contacts && contacts.length !== filteredContacts.length) updateSettings({ contacts: filteredContacts });
  }, [contacts, filteredContacts, updateSettings]);

  return { contacts: filteredContacts, allContacts };
}
