import { useEffect, useLayoutEffect, useMemo } from 'react';

import constate from 'constate';

import { ACCOUNT_PKH_STORAGE_KEY } from 'lib/constants';
import { IS_DEV_ENV } from 'lib/env';
import { michelEncoder, loadFastRpcClient } from 'lib/temple/helpers';
import {
  ReadyTempleState,
  TempleAccountType,
  TempleStatus,
  TempleState,
  TempleNotification,
  TempleMessageType
} from 'lib/temple/types';
import { ReactiveTezosToolkit } from 'temple/tezos';

import { intercom, useTempleClient } from './client';
import { usePassiveStorage } from './storage';

export const [
  ReadyTempleProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useSetAccountPkh,
  useAccount,
  useAccountPkh,
  useSettings,
  useTezos
] = constate(
  useReadyTemple,
  v => v.allNetworks,
  v => v.setNetworkId,
  v => v.network,
  v => v.allAccounts,
  v => v.setAccountPkh,
  v => v.account,
  v => v.accountPkh,
  v => v.settings,
  v => v.tezos
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const {
    networks: allNetworks,
    accounts: allAccounts,
    settings,
    createTaquitoSigner,
    createTaquitoWallet
  } = templeFront;

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

  const defaultAcc = allAccounts[0];
  const [accountPkh, setAccountPkh] = usePassiveStorage(ACCOUNT_PKH_STORAGE_KEY, defaultAcc.publicKeyHash, true);

  useEffect(() => {
    return intercom.subscribe((msg: TempleNotification) => {
      switch (msg?.type) {
        case TempleMessageType.SelectedAccountChanged:
          setAccountPkh(msg.accountPublicKeyHash);
          break;
      }
    });
  }, [setAccountPkh]);

  useEffect(() => {
    if (allAccounts.every(a => a.publicKeyHash !== accountPkh)) {
      setAccountPkh(defaultAcc.publicKeyHash);
    }
  }, [allAccounts, accountPkh, setAccountPkh, defaultAcc]);

  const account = useMemo(
    () => allAccounts.find(a => a.publicKeyHash === accountPkh) ?? defaultAcc,
    [allAccounts, accountPkh, defaultAcc]
  );

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [networkId, accountPkh]);

  /**
   * tezos = TezosToolkit instance
   */

  const tezos = useMemo(() => {
    const checksum = [network.id, account.publicKeyHash].join('_');
    const rpc = network.rpcBaseURL;
    const pkh = account.type === TempleAccountType.ManagedKT ? account.owner : account.publicKeyHash;

    const t = new ReactiveTezosToolkit(loadFastRpcClient(rpc), checksum);
    t.setSignerProvider(createTaquitoSigner(pkh));
    t.setWalletProvider(createTaquitoWallet(pkh, rpc));
    t.setPackerProvider(michelEncoder);

    return t;
  }, [createTaquitoSigner, createTaquitoWallet, network, account]);

  useEffect(() => {
    if (IS_DEV_ENV) {
      (window as any).tezos = tezos;
    }
  }, [tezos]);

  return {
    allNetworks,
    network,
    networkId,
    setNetworkId,

    allAccounts,
    account,
    accountPkh,
    setAccountPkh,

    settings,
    tezos
  };
}

function assertReady(state: TempleState): asserts state is ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}
