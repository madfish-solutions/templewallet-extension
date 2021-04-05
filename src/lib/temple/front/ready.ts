import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { TezosToolkit } from "@taquito/taquito";
import { Tzip16Module } from "@taquito/tzip16";
import constate from "constate";

import { useRetryableSWR } from "lib/swr";
import { FastRpcClient } from "lib/taquito-fast-rpc";
import {
  ReadyTempleState,
  TempleAccountType,
  TempleStatus,
  TempleState,
  TempleAsset,
  getClient,
  usePassiveStorage,
  useTempleClient,
  loadChainId,
  michelEncoder,
} from "lib/temple/front";

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated,
}

export const [
  ReadyTempleProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useSetAccountPkh,
  useAccount,
  useSettings,
  useTezos,
  useTezosDomainsClient,
] = constate(
  useReadyTemple,
  (v) => v.allNetworks,
  (v) => v.setNetworkId,
  (v) => v.network,
  (v) => v.allAccounts,
  (v) => v.setAccountPkh,
  (v) => v.account,
  (v) => v.settings,
  (v) => v.tezos,
  (v) => v.tezosDomainsClient
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const {
    networks: allNetworks,
    accounts: allAccounts,
    settings,
    createTaquitoSigner,
    createTaquitoWallet,
  } = templeFront;

  /**
   * Networks
   */

  const defaultNet = allNetworks[0];
  const [networkId, setNetworkId] = usePassiveStorage(
    "network_id",
    defaultNet.id
  );

  useEffect(() => {
    if (allNetworks.every((a) => a.id !== networkId)) {
      setNetworkId(defaultNet.id);
    }
  }, [allNetworks, networkId, setNetworkId, defaultNet]);

  const network = useMemo(
    () => allNetworks.find((n) => n.id === networkId) ?? defaultNet,
    [allNetworks, networkId, defaultNet]
  );

  /**
   * Accounts
   */

  const defaultAcc = allAccounts[0];
  const [accountPkh, setAccountPkh] = usePassiveStorage(
    "account_publickeyhash",
    defaultAcc.publicKeyHash
  );

  useEffect(() => {
    if (allAccounts.every((a) => a.publicKeyHash !== accountPkh)) {
      setAccountPkh(defaultAcc.publicKeyHash);
    }
  }, [allAccounts, accountPkh, setAccountPkh, defaultAcc]);

  const account = useMemo(
    () => allAccounts.find((a) => a.publicKeyHash === accountPkh) ?? defaultAcc,
    [allAccounts, accountPkh, defaultAcc]
  );

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent("reseterrorboundary");
    window.dispatchEvent(evt);
  }, [networkId, accountPkh]);

  /**
   * tezos = TezosToolkit instance
   */

  const tezos = useMemo(() => {
    const checksum = [network.id, account.publicKeyHash].join("_");
    const rpc = network.rpcBaseURL;
    const pkh =
      account.type === TempleAccountType.ManagedKT
        ? account.owner
        : account.publicKeyHash;

    const t = new ReactiveTezosToolkit(
      new FastRpcClient(rpc),
      checksum,
      network.lambdaContract
    );
    t.setSignerProvider(createTaquitoSigner(pkh));
    t.setWalletProvider(createTaquitoWallet(pkh, rpc));
    t.setPackerProvider(michelEncoder);
    return t;
  }, [createTaquitoSigner, createTaquitoWallet, network, account]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as any).tezos = tezos;
    }
  }, [tezos]);

  /**
   * Tezos domains
   */
  const tezosDomainsClient = useMemo(() => getClient(networkId, tezos), [
    networkId,
    tezos,
  ]);

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
    tezos,
    tezosDomainsClient,
  };
}

export function useChainId(suspense?: boolean) {
  const tezos = useTezos();
  const rpcUrl = useMemo(() => tezos.rpc.getRpcUrl(), [tezos]);
  return useCustomChainId(rpcUrl, suspense);
}

export function useCustomChainId(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = useCallback(async () => {
    try {
      return await loadChainId(rpcUrl);
    } catch (_err) {
      return null;
    }
  }, [rpcUrl]);

  const { data: chainId } = useRetryableSWR(
    ["chain-id", rpcUrl],
    fetchChainId,
    { suspense, revalidateOnFocus: false }
  );
  return chainId;
}

export function useRelevantAccounts(withExtraTypes = true) {
  const allAccounts = useAllAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  const lazyChainId = useChainId();

  const relevantAccounts = useMemo(
    () =>
      allAccounts.filter((acc) => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return withExtraTypes && acc.chainId === lazyChainId;

          case TempleAccountType.WatchOnly:
            return (
              withExtraTypes && (!acc.chainId || acc.chainId === lazyChainId)
            );

          default:
            return true;
        }
      }),
    [allAccounts, lazyChainId, withExtraTypes]
  );

  useEffect(() => {
    if (
      relevantAccounts.every(
        (a) => a.publicKeyHash !== account.publicKeyHash
      ) &&
      lazyChainId
    ) {
      setAccountPkh(relevantAccounts[0].publicKeyHash);
    }
  }, [relevantAccounts, account, setAccountPkh, lazyChainId]);

  return useMemo(() => relevantAccounts, [relevantAccounts]);
}

export const [TempleRefsProvider, useAllAssetsRef] = constate(
  useRefs,
  (v) => v.allAssetsRef
);

function useRefs() {
  /**
   * All assets reference(cache), needed for pretty network reselect
   */
  const allAssetsRef = useRef<TempleAsset[]>([]);

  return { allAssetsRef };
}

export class ReactiveTezosToolkit extends TezosToolkit {
  constructor(
    rpc: string | FastRpcClient,
    public checksum: string,
    public lambdaContract?: string
  ) {
    super(rpc);
    this.addExtension(new Tzip16Module());
  }
}

function assertReady(state: TempleState): asserts state is ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error("Temple not ready");
  }
}
