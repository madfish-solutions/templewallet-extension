import * as React from "react";
import constate from "constate";
import { TezosToolkit } from "@taquito/taquito";
import { usePassiveStorage } from "lib/thanos/front/storage";
import { useThanosClient } from "lib/thanos/front/client";
import { ReadyThanosState, ThanosStatus, ThanosState } from "lib/thanos/types";

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated,
}

export const [ReadyThanosProvider, useReadyThanos] = constate(() => {
  const thanosFront = useThanosClient();
  assertReady(thanosFront);

  const {
    networks: allNetworks,
    accounts: allAccounts,
    createSigner,
  } = thanosFront;

  /**
   * Networks
   */

  const [netIndex, setNetIndex] = usePassiveStorage("network_id", 0);

  React.useEffect(() => {
    if (netIndex >= allNetworks.length) {
      setNetIndex(0);
    }
  }, [allNetworks.length, netIndex, setNetIndex]);

  const safeNetIndex = netIndex in allNetworks ? netIndex : 0;
  const network = allNetworks[safeNetIndex];

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

  const account =
    allAccounts.find((a) => a.publicKeyHash === accountPkh) ?? defaultAcc;

  /**
   * tezos = TezosToolkit instance
   */

  const tezos = React.useMemo(() => {
    const t = new TezosToolkit();
    const rpc = network.rpcBaseURL;
    const signer = createSigner(accountPkh);
    t.setProvider({ rpc, signer });
    return t;
  }, [createSigner, network.rpcBaseURL, accountPkh]);

  const tezosKey = React.useMemo(
    () => [network.rpcBaseURL, accountPkh].join(","),
    [network.rpcBaseURL, accountPkh]
  );

  const activateAccount = React.useCallback(
    async (secret: string) => {
      let op;
      try {
        op = await tezos.tz.activate(accountPkh, secret);
      } catch (err) {
        const invalidActivationError =
          err && err.body && /Invalid activation/.test(err.body);
        if (invalidActivationError) {
          return [ActivationStatus.AlreadyActivated] as [ActivationStatus];
        }

        throw err;
      }

      return [ActivationStatus.ActivationRequestSent, op] as [
        ActivationStatus,
        typeof op
      ];
    },
    [accountPkh, tezos]
  );

  return {
    allNetworks,
    network,
    netIndex,
    setNetIndex,

    allAccounts,
    account,
    accountPkh,
    setAccountPkh,

    tezos,
    tezosKey,
    activateAccount,
  };
});

function assertReady(state: ThanosState): asserts state is ReadyThanosState {
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Thanos not ready");
  }
}
