import * as React from "react";
import constate from "constate";
import { TezosToolkit } from "@taquito/taquito";
import usePassiveStorage from "lib/thanos/front/usePassiveStorage";
import { useThanosClient } from "lib/thanos/front/client";
import { ReadyThanosState, ThanosStatus, ThanosState } from "lib/thanos/types";

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated
}

export const [ReadyThanosProvider, useReadyThanos] = constate(() => {
  const thanosFront = useThanosClient();
  assertReady(thanosFront);

  const {
    networks: allNetworks,
    accounts: allAccounts,
    createSigner
  } = thanosFront;

  /**
   * Networks
   */

  const [netIndex, setNetIndex] = usePassiveStorage("network_id", 0);
  const network = useSafeListItem(allNetworks, netIndex, setNetIndex);

  /**
   * Accounts
   */

  const [accIndex, setAccIndex] = usePassiveStorage("account_index", 0);
  const account = useSafeListItem(allAccounts, accIndex, setAccIndex);
  const accountPkh = account.publicKeyHash;

  /**
   * tezos = TezosToolkit instance
   */

  const tezos = React.useMemo(() => {
    const t = new TezosToolkit();
    const rpc = network.rpcBaseURL;
    const signer = createSigner(accIndex, accountPkh);
    t.setProvider({ rpc, signer });
    return t;
  }, [createSigner, network.rpcBaseURL, accIndex, accountPkh]);

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
    accIndex,
    setAccIndex,

    tezos,
    activateAccount
  };
});

function useSafeListItem<T>(
  list: T[],
  index: number,
  setIndex: React.Dispatch<number>
) {
  const safeIndex = index in list ? index : 0;
  const item = list[safeIndex];

  React.useEffect(() => {
    if (index >= list.length) {
      setIndex(0);
    }
  }, [list, index, setIndex]);

  return item;
}

function assertReady(state: ThanosState): asserts state is ReadyThanosState {
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Thanos not ready");
  }
}
