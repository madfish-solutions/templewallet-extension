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
  domainsResolverFactory,
} from "lib/thanos/front";
import { useRetryableSWR } from "lib/swr";
import { getUsersContracts } from "lib/tzkt";
import {
  ThanosAccount,
  ThanosAccountType,
  ThanosContractAccount,
} from "lib/thanos/types";

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
  useTezosDomains,
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
  (v) => v.tezosDomains
);

function useReadyThanos() {
  const thanosFront = useThanosClient();
  assertReady(thanosFront);

  const {
    networks: allNetworks,
    accounts: userAccounts,
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

  const usersContractsQueryKey = React.useMemo(
    () => [
      "usersContracts",
      network.id,
      ...userAccounts.map(({ publicKeyHash }) => publicKeyHash),
    ],
    [network.id, userAccounts]
  );
  const { data: usersContracts = [] } = useRetryableSWR(
    usersContractsQueryKey,
    getUsersContracts
  );

  const allAccounts = React.useMemo<ThanosAccount[]>(
    () => [
      ...userAccounts,
      ...usersContracts?.map<ThanosContractAccount>(
        ({ alias, address }, index) => ({
          type: ThanosAccountType.Contract,
          name: alias || `Contract ${index + 1}`,
          publicKeyHash: address,
        })
      ),
    ],
    [userAccounts, usersContracts]
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

  const getAccountOwner = React.useCallback(
    async (
      _k: string,
      address: string,
      networkId: string,
      accountType: ThanosAccountType
    ) => {
      if (accountType !== ThanosAccountType.Contract) {
        return undefined;
      }

      const checksum = [networkId, address].join("_");
      const t = new ReactiveTezosToolkit(checksum);
      t.setRpcProvider(
        allNetworks.find((network) => network.id === networkId)!.rpcBaseURL
      );
      const contract = await t.contract.at(address);
      const storage = await contract.storage();
      return typeof storage === "string" ? storage : undefined;
    },
    [allNetworks]
  );
  const { data: accountOwner } = useRetryableSWR(
    ["get-account-owner", accountPkh, networkId, account.type],
    getAccountOwner
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
    const { publicKeyHash: accountPkh } = account;
    const checksum = [network.id, accountPkh].join("_");
    const t = new ReactiveTezosToolkit(checksum);
    const rpc = network.rpcBaseURL;
    const signer = createTaquitoSigner(
      account.type === ThanosAccountType.Contract ? accountOwner! : accountPkh
    );
    const wallet = createTaquitoWallet(accountPkh, rpc);
    t.setProvider({ rpc, signer, wallet });
    return t;
  }, [
    createTaquitoSigner,
    createTaquitoWallet,
    network,
    account,
    accountOwner,
  ]);

  const tezosDomains = React.useMemo(
    () => domainsResolverFactory(tezos, network.id),
    [tezos, network.id]
  );

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
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
    tezos,
    tezosDomains,
  };
}

export const [ThanosRefsProvider, useAllAssetsRef] = constate(
  useRefs,
  (v) => v.allAssetsRef
);

function useRefs() {
  /**
   * All assets reference(cache), needed for pretty network reselect
   */
  const allAssetsRef = React.useRef<ThanosAsset[]>([]);

  return { allAssetsRef };
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
