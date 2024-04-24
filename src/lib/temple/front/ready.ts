import { useEffect, useLayoutEffect, useMemo } from 'react';

import constate from 'constate';

import {
  ReadyTempleState,
  TempleStatus,
  TempleState,
  TempleNotification,
  TempleMessageType,
  DisplayedGroup
} from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { getAccountAddressForTezos, getAccountForEvm, getAccountForTezos } from 'temple/accounts';
import { getAllGroups } from 'temple/front/get-all-groups';
import { intercomClient } from 'temple/front/intercom-client';

import { useTempleClient } from './client';
import { usePassiveStorage } from './storage';

export const [
  ReadyTempleProvider,
  useAllNetworks,
  useNetwork,
  useSetNetworkId,
  useAllAccounts,
  useCurrentAccountId,
  useAccount,
  useAccountAddressForTezos,
  useAccountForTezos,
  useAccountAddressForEvm,
  useAccountForEvm,
  useSetAccountId,
  useSettings,
  useAllGroups,
  useHDGroups,
  useCurrentAccountGroup
] = constate(
  useReadyTemple,
  v => v.allNetworks,
  v => v.network,
  v => v.setNetworkId,
  v => v.allAccounts,
  v => v.accountId,
  v => v.account,
  v => v.accountAddressForTezos,
  v => v.accountForTezos,
  v => v.accountAddressForEvm,
  v => v.accountForEvm,
  v => v.setAccountId,
  v => v.settings,
  v => v.allGroups,
  v => v.hdGroups,
  v => v.currentAccountGroup
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const { networks: allNetworks, accounts: allAccounts, settings, hdGroups } = templeFront;

  /**
   * Networks
   */

  const defaultNet = allNetworks[0];
  const [networkId, setNetworkId] = usePassiveStorage('network_id', defaultNet.id);

  useEffect(() => {
    if (allNetworks.every(a => a.id !== networkId)) {
      setNetworkId(defaultNet.id);
    }
  }, [allNetworks, networkId, setNetworkId, defaultNet]);

  const network = useMemo(
    () => allNetworks.find(n => n.id === networkId) ?? defaultNet,
    [allNetworks, networkId, defaultNet]
  );

  /**
   * Accounts
   */

  const allAccountsRef = useUpdatableRef(allAccounts);

  const defaultAcc = allAccounts[0]!;

  const [accountId, setAccountId] = usePassiveStorage('CURRENT_ACCOUNT_ID', defaultAcc.id);

  useEffect(() => {
    return intercomClient.subscribe((msg: TempleNotification) => {
      switch (msg?.type) {
        case TempleMessageType.SelectedAccountChanged:
          const account = allAccountsRef.current.find(
            acc => getAccountAddressForTezos(acc) === msg.accountPublicKeyHash
          );
          if (account) setAccountId(account.id);
          break;
      }
    });
  }, [setAccountId, allAccountsRef]);

  useEffect(() => {
    if (allAccounts.every(a => a.id !== accountId)) {
      setAccountId(defaultAcc.id);
    }
  }, [allAccounts, defaultAcc, accountId, setAccountId]);

  const account = useMemo(
    () => allAccounts.find(a => a.id === accountId) ?? defaultAcc,
    [allAccounts, defaultAcc, accountId]
  );

  const accountForTezos = useMemo(() => getAccountForTezos(account), [account]);
  const accountAddressForTezos = accountForTezos?.address;
  const accountForEvm = useMemo(() => getAccountForEvm(account), [account]);
  const accountAddressForEvm = accountForEvm?.address as HexString | undefined;

  /**
   * Groups
   */
  const allGroups = useMemo<DisplayedGroup[]>(() => getAllGroups(hdGroups, allAccounts), [hdGroups, allAccounts]);
  const currentAccountGroup = allGroups.find(g => g.accounts.some(acc => acc.id === accountId))!;

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [networkId, accountId]);

  return {
    allNetworks,
    network,
    networkId,
    setNetworkId,

    allAccounts,
    accountId,
    account,
    accountAddressForTezos,
    accountForTezos,
    accountAddressForEvm,
    accountForEvm,
    allGroups,
    hdGroups,
    currentAccountGroup,
    setAccountId,

    settings
  };
}

function assertReady(state: TempleState): asserts state is ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}
