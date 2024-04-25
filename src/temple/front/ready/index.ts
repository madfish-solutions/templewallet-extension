import { useLayoutEffect } from 'react';

import constate from 'constate';

import { useTempleClient } from 'lib/temple/front/client';
import { TempleStatus, TempleState, StoredAccount, TempleSettings } from 'lib/temple/types';

import { useReadyTempleAccounts } from './accounts';
import { useReadyTempleGroups } from './groups';
import { useReadyTempleTezosNetworks, useReadyTempleEvmNetworks } from './networks';

export const [
  ReadyTempleProvider,
  //
  useAllTezosChains,
  useEnabledTezosChains,
  //
  useAllEvmChains,
  useEnabledEvmChains,
  //
  useAllAccounts,
  useCurrentAccountId,
  useAccount,
  useAccountAddressForTezos,
  useAccountForTezos,
  useAccountAddressForEvm,
  useAccountForEvm,
  useSetAccountId,
  //
  useSettings,
  //
  useAllGroups,
  useHDGroups
] = constate(
  useReadyTemple,
  //
  v => v.allTezosChains,
  v => v.enabledTezosChains,
  //
  v => v.allEvmChains,
  v => v.enabledEvmChains,
  //
  v => v.allAccounts,
  v => v.accountId,
  v => v.account,
  v => v.accountAddressForTezos,
  v => v.accountForTezos,
  v => v.accountAddressForEvm,
  v => v.accountForEvm,
  v => v.setAccountId,
  //
  v => v.settings,
  //
  v => v.allGroups,
  v => v.hdGroups
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const { customTezosNetworks, customEvmNetworks, accounts: allAccounts, settings, hdGroups } = templeFront;

  const readyTempleTezosNetworks = useReadyTempleTezosNetworks(customTezosNetworks);
  const readyTempleEvmNetworks = useReadyTempleEvmNetworks(customEvmNetworks);

  const readyTempleAccounts = useReadyTempleAccounts(allAccounts);

  const readyTempleGroups = useReadyTempleGroups(allAccounts, hdGroups);

  /** Error boundary reset */
  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [readyTempleAccounts.accountId]);

  return {
    ...readyTempleTezosNetworks,
    ...readyTempleEvmNetworks,

    ...readyTempleAccounts,

    ...readyTempleGroups,

    settings
  };
}

function assertReady<T extends TempleState>(state: T): asserts state is T & ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}

interface ReadyTempleState {
  status: TempleStatus.Ready;
  accounts: NonEmptyArray<StoredAccount>;
  settings: TempleSettings;
}
