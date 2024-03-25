import { useEffect, useLayoutEffect, useMemo } from 'react';

import constate from 'constate';

import { ReadyTempleState, TempleStatus, TempleState, TempleNotification, TempleMessageType } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { getAccountAddressForTezos } from 'temple/accounts';
import { intercomClient } from 'temple/front/intercom-client';

import { useTempleClient } from './client';
import { usePassiveStorage } from './storage';

export const [
  ReadyTempleProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useCurrentAccountId,
  useSetAccountId,
  useAccount,
  useSettings
] = constate(
  useReadyTemple,
  v => v.allNetworks,
  v => v.setNetworkId,
  v => v.network,
  v => v.allAccounts,
  v => v.accountId,
  v => v.setAccountId,
  v => v.account,
  v => v.settings
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const { networks: allNetworks, accounts: allAccounts, settings } = templeFront;

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
    setAccountId,

    settings
  };
}

function assertReady(state: TempleState): asserts state is ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}
