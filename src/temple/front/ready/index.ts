import { useLayoutEffect } from 'react';

import constate from 'constate';

import { useTempleClient } from 'lib/temple/front/client';
import { TempleStatus, TempleState, StoredAccount, TempleSettings } from 'lib/temple/types';

import { useReadyTempleAccounts } from './accounts';
import { useReadyTempleTezosNetworks, useReadyTempleEvmNetworks } from './networks';

export const [
  ReadyTempleProvider,
  //
  useAllTezosNetworks,
  useAllTezosChains,
  useTezosNetwork,
  useSetTezosNetworkId,
  //
  useAllEvmNetworks,
  useAllEvmChains,
  useEvmNetwork,
  useSetEvmNetworkId,
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
  useSettings
] = constate(
  useReadyTemple,
  //
  v => v.allTezosNetworks,
  v => v.allTezosChains,
  v => v.tezosNetwork,
  v => v.setTezosNetworkId,
  //
  v => v.allEvmNetworks,
  v => v.allEvmChains,
  v => v.evmNetwork,
  v => v.setEvmNetworkId,
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
  v => v.settings
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const { customTezosNetworks, customEvmNetworks, accounts: allAccounts, settings } = templeFront;

  const readyTempleTezosNetworks = useReadyTempleTezosNetworks(customTezosNetworks);
  const readyTempleEvmNetworks = useReadyTempleEvmNetworks(customEvmNetworks);

  const readyTempleAccounts = useReadyTempleAccounts(allAccounts);

  /** Error boundary reset */
  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [readyTempleAccounts.accountId, readyTempleTezosNetworks.tezosNetwork.id, readyTempleEvmNetworks.evmNetwork.id]);

  return {
    ...readyTempleTezosNetworks,
    ...readyTempleEvmNetworks,

    ...readyTempleAccounts,

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
