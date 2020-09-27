import * as React from "react";
import constate from "constate";
import { TezosToolkit } from "@taquito/taquito";
import {
  ReadyThanosState,
  ThanosStatus,
  ThanosState,
  ThanosAsset,
  usePassiveStorage,
  useThanosClient,
} from "lib/thanos/front";

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated,
}

export const [
  ReadyThanosProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useSetAccountPkh,
  useAccount,
  useSettings,
  useTezos,
  useAllAssetsRef,
] = constate(
  useReadyThanos,
  (v) => v.allNetworks,
  (v) => v.setNetworkId,
  (v) => v.network,
  (v) => v.allAccounts,
  (v) => v.setAccountPkh,
  (v) => v.account,
  (v) => v.settings,
  (v) => v.tezos,
  (v) => v.allAssetsRef
);

function useReadyThanos() {
  const thanosFront = useThanosClient();
  assertReady(thanosFront);

  const {
    networks: allNetworks,
    accounts: allAccounts,
    settings,
    createTaquitoSigner,
    createTaquitoWallet,
  } = thanosFront;

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
    const checksum = [network.id, accountPkh].join("_");
    const t = new ReactiveTezosToolkit(checksum);
    const rpc = network.rpcBaseURL;
    const signer = createTaquitoSigner(accountPkh);
    const wallet = createTaquitoWallet(accountPkh, rpc);
    t.setProvider({ rpc, signer, wallet });
    return t;
  }, [createTaquitoSigner, createTaquitoWallet, network, accountPkh]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as any).tezos = tezos;
    }
  }, [tezos]);

  /**
   * All assets reference(cache), needed for pretty network reselect
   */
  const allAssetsRef = React.useRef<ThanosAsset[]>([]);

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
    allAssetsRef,
  };
}

export class ReactiveTezosToolkit extends TezosToolkit {
  constructor(public checksum: string) {
    super();
  }
}

function assertReady(state: ThanosState): asserts state is ReadyThanosState {
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Thanos not ready");
  }
}
