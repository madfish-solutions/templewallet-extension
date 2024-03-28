import { useEffect, useLayoutEffect, useMemo } from 'react';

import constate from 'constate';
import { isEqual } from 'lodash';

import { CURRENT_TEZOS_NETWORK_ID_STORAGE_KEY } from 'lib/constants';
import {
  TempleStatus,
  TempleState,
  TempleNotification,
  TempleMessageType,
  StoredAccount,
  TempleSettings
} from 'lib/temple/types';
import { useMemoWithCompare, useUpdatableRef } from 'lib/ui/hooks';
import { getAccountAddressForTezos, getAccountForEvm, getAccountForTezos } from 'temple/accounts';
import { intercomClient } from 'temple/front/intercom-client';
import { DEFAULT_TEZOS_NETWORKS } from 'temple/networks';

import { useTempleClient } from './client';
import { usePassiveStorage } from './storage';

export const [
  ReadyTempleProvider,
  useAllTezosNetworks,
  useTezosNetworkStored,
  useSetNetworkId,
  useAllAccounts,
  useCurrentAccountId,
  useAccount,
  useAccountAddressForTezos,
  useAccountForTezos,
  useAccountAddressForEvm,
  useAccountForEvm,
  useSetAccountId,
  useSettings
] = constate(
  useReadyTemple,
  v => v.allTezosNetworks,
  v => v.tezosNetwork,
  v => v.setNetworkId,
  v => v.allAccounts,
  v => v.accountId,
  v => v.account,
  v => v.accountAddressForTezos,
  v => v.accountForTezos,
  v => v.accountAddressForEvm,
  v => v.accountForEvm,
  v => v.setAccountId,
  v => v.settings
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const { customTezosNetworks, accounts: allAccounts, settings } = templeFront;

  /**
   * Networks
   */

  const allTezosNetworks = useMemo(() => [...DEFAULT_TEZOS_NETWORKS, ...customTezosNetworks], [customTezosNetworks]);

  const defaultNet = allTezosNetworks[0];
  const [networkId, setNetworkId] = usePassiveStorage(CURRENT_TEZOS_NETWORK_ID_STORAGE_KEY, defaultNet.id);

  useEffect(() => {
    if (allTezosNetworks.every(a => a.id !== networkId)) {
      setNetworkId(defaultNet.id);
    }
  }, [allTezosNetworks, networkId, setNetworkId, defaultNet]);

  const tezosNetwork = useMemoWithCompare(
    () => allTezosNetworks.find(n => n.id === networkId) ?? defaultNet,
    [allTezosNetworks, networkId, defaultNet],
    isEqual
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

  const account = useMemoWithCompare(
    () => allAccounts.find(a => a.id === accountId) ?? defaultAcc,
    [allAccounts, defaultAcc, accountId],
    isEqual
  );

  const accountForTezos = useMemo(() => getAccountForTezos(account), [account]);
  const accountAddressForTezos = accountForTezos?.address;
  const accountForEvm = useMemo(() => getAccountForEvm(account), [account]);
  const accountAddressForEvm = accountForEvm?.address as HexString | undefined;

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [networkId, accountId]);

  return {
    allTezosNetworks,
    tezosNetwork,
    networkId,
    setNetworkId,

    allAccounts,
    accountId,
    account,
    accountAddressForTezos,
    accountForTezos,
    accountAddressForEvm,
    accountForEvm,
    setAccountId,

    settings
  };
}

function assertReady<T extends TempleState>(state: T): asserts state is T & ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}

interface ReadyTempleState extends TempleState {
  status: TempleStatus.Ready;
  accounts: NonEmptyArray<StoredAccount>;
  settings: TempleSettings;
}
