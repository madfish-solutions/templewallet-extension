import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import { RpcClientInterface } from '@taquito/rpc';
import { TezosToolkit } from '@taquito/taquito';
import { Tzip16Module } from '@taquito/tzip16';
import constate from 'constate';

import { ACCOUNT_PKH_STORAGE_KEY } from 'lib/constants';
import { IS_DEV_ENV } from 'lib/env';
import { useRetryableSWR } from 'lib/swr';
import { loadChainId, michelEncoder, loadFastRpcClient } from 'lib/temple/helpers';
import {
  ReadyTempleState,
  TempleAccountType,
  TempleStatus,
  TempleState,
  TempleNotification,
  TempleMessageType
} from 'lib/temple/types';

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

export function useChainId(suspense?: boolean) {
  const tezos = useTezos();
  const rpcUrl = useMemo(() => tezos.rpc.getRpcUrl(), [tezos]);

  const { data: chainId } = useChainIdLoading(rpcUrl, suspense);

  return chainId;
}

export function useChainIdValue(rpcUrl: string, suspense?: boolean) {
  const { data: chainId } = useChainIdLoading(rpcUrl, suspense);

  return chainId;
}

export function useChainIdLoading(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(() => loadChainId(rpcUrl).catch(() => null), [rpcUrl]);

  return useRetryableSWR(['chain-id', rpcUrl], fetchChainId, { suspense, revalidateOnFocus: false });
}

export function useRelevantAccounts(withExtraTypes = true) {
  const allAccounts = useAllAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  const lazyChainId = useChainId();

  const relevantAccounts = useMemo(
    () =>
      allAccounts.filter(acc => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return withExtraTypes && acc.chainId === lazyChainId;

          case TempleAccountType.WatchOnly:
            return withExtraTypes && (!acc.chainId || acc.chainId === lazyChainId);

          default:
            return true;
        }
      }),
    [allAccounts, lazyChainId, withExtraTypes]
  );

  useEffect(() => {
    if (relevantAccounts.every(a => a.publicKeyHash !== account.publicKeyHash) && lazyChainId) {
      setAccountPkh(relevantAccounts[0].publicKeyHash);
    }
  }, [relevantAccounts, account, setAccountPkh, lazyChainId]);

  return useMemo(() => relevantAccounts, [relevantAccounts]);
}

export class ReactiveTezosToolkit extends TezosToolkit {
  constructor(rpc: string | RpcClientInterface, public checksum: string) {
    super(rpc);
    this.addExtension(new Tzip16Module());
  }
}

function assertReady(state: TempleState): asserts state is ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}
