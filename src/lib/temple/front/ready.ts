import * as React from "react";
import constate from "constate";
import { TezosToolkit } from "@taquito/taquito";
import { Tzip16Module } from "@taquito/tzip16";
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
} from "lib/temple/front";
import { FastRpcClient } from "lib/taquito-fast-rpc";
import { useRetryableSWR } from "lib/swr";

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

  React.useEffect(() => {
    if (allNetworks.every((a) => a.id !== networkId)) {
      setNetworkId(defaultNet.id);
    }
  }, [allNetworks, networkId, setNetworkId, defaultNet]);

  const network = React.useMemo(
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

  React.useEffect(() => {
    if (allAccounts.every((a) => a.publicKeyHash !== accountPkh)) {
      setAccountPkh(defaultAcc.publicKeyHash);
    }
  }, [allAccounts, accountPkh, setAccountPkh, defaultAcc]);

  const account = React.useMemo(
    () => allAccounts.find((a) => a.publicKeyHash === accountPkh) ?? defaultAcc,
    [allAccounts, accountPkh, defaultAcc]
  );

  /**
   * Error boundary reset
   */

  React.useLayoutEffect(() => {
    const evt = new CustomEvent("reseterrorboundary");
    window.dispatchEvent(evt);
  }, [networkId, accountPkh]);

  /**
   * tezos = TezosToolkit instance
   */

  const tezos = React.useMemo(() => {
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
    return t;
  }, [createTaquitoSigner, createTaquitoWallet, network, account]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as any).tezos = tezos;
    }
  }, [tezos]);

  /**
   * Tezos domains
   */
  const tezosDomainsClient = React.useMemo(() => getClient(networkId, tezos), [
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
  const rpcUrl = React.useMemo(() => tezos.rpc.getRpcUrl(), [tezos]);
  return useCustomChainId(rpcUrl, suspense);
}

export function useCustomChainId(rpcUrl: string, suspense?: boolean) {
  const fetchChainId = React.useCallback(async () => {
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

  const relevantAccounts = React.useMemo(
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

  React.useEffect(() => {
    if (
      relevantAccounts.every(
        (a) => a.publicKeyHash !== account.publicKeyHash
      ) &&
      lazyChainId
    ) {
      setAccountPkh(relevantAccounts[0].publicKeyHash);
    }
  }, [relevantAccounts, account, setAccountPkh, lazyChainId]);

  return React.useMemo(() => relevantAccounts, [relevantAccounts]);
}

export const [TempleRefsProvider, useAllAssetsRef] = constate(
  useRefs,
  (v) => v.allAssetsRef
);

function useRefs() {
  /**
   * All assets reference(cache), needed for pretty network reselect
   */
  const allAssetsRef = React.useRef<TempleAsset[]>([]);

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
